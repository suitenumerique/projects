/**
 * current-user hook
 *
 * @description :: A hook definition. Extends Sails by adding shadow routes, implicit actions,
 *                 and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */

module.exports = function defineCurrentUserHook(sails) {
  const TOKEN_PATTERN = /^Bearer /;
  const API_TOKEN_PREFIX = 'prj_';
  const LAST_USED_AT_THROTTLE_MS = 60 * 1000;
  const RATE_LIMIT_WINDOW_MS = 60 * 1000;
  const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

  // Fixed-window request counters per API token and kind ("read" / "write").
  // In memory: the limit applies per server instance.
  const rateLimitWindows = new Map();

  setInterval(() => {
    const now = Date.now();

    rateLimitWindows.forEach((window, key) => {
      if (window.resetAt <= now) {
        rateLimitWindows.delete(key);
      }
    });
  }, RATE_LIMIT_WINDOW_MS).unref();

  const consumeRateLimit = (apiToken, method) => {
    const kind = READ_METHODS.includes(method) ? 'read' : 'write';
    const limit =
      kind === 'read'
        ? sails.config.custom.apiTokenRateLimitRead
        : sails.config.custom.apiTokenRateLimitWrite;

    const key = `${apiToken.id}:${kind}`;
    const now = Date.now();

    let window = rateLimitWindows.get(key);
    if (!window || window.resetAt <= now) {
      window = {
        count: 0,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      };

      rateLimitWindows.set(key, window);
    }

    window.count += 1;

    return {
      limit,
      remaining: Math.max(0, limit - window.count),
      resetInSeconds: Math.ceil((window.resetAt - now) / 1000),
      isExceeded: window.count > limit,
    };
  };

  const getApiTokenAndUser = async (token) => {
    const apiToken = await ApiToken.findOne({
      tokenHash: sails.helpers.apiTokens.hash(token),
    });

    if (!apiToken) {
      return null;
    }

    const now = new Date();

    if (apiToken.expiresAt && new Date(apiToken.expiresAt) <= now) {
      return null;
    }

    const user = await sails.helpers.users.getOne(apiToken.userId);

    if (!user) {
      return null;
    }

    // A password change revokes every token issued before it, like sessions.
    if (user.passwordChangedAt && new Date(user.passwordChangedAt) > new Date(apiToken.createdAt)) {
      return null;
    }

    if (!apiToken.lastUsedAt || now - new Date(apiToken.lastUsedAt) > LAST_USED_AT_THROTTLE_MS) {
      // Fire-and-forget: tracking usage must not slow down or fail the request.
      ApiToken.updateOne({ id: apiToken.id })
        .set({ lastUsedAt: now.toISOString() })
        .catch((error) => sails.log.warn(`Unable to update API token usage: ${error}`));
    }

    return {
      apiToken,
      user,
    };
  };

  const getSessionAndUser = async (accessToken, httpOnlyToken) => {
    let payload;
    try {
      payload = sails.helpers.utils.verifyJwtToken(accessToken);
    } catch (error) {
      return null;
    }

    const session = await Session.findOne({
      accessToken,
      deletedAt: null,
    });

    if (!session) {
      return null;
    }

    if (session.httpOnlyToken && httpOnlyToken !== session.httpOnlyToken) {
      return null;
    }

    const user = await sails.helpers.users.getOne(payload.subject);

    if (user && user.passwordChangedAt > payload.issuedAt) {
      return null;
    }

    return {
      session,
      user,
    };
  };

  return {
    /**
     * Runs when this Sails app loads/lifts.
     */

    async initialize() {
      sails.log.info('Initializing custom hook (`current-user`)');
    },

    routes: {
      before: {
        '/api/*': {
          async fn(req, res, next) {
            const { authorization: authorizationHeader } = req.headers;

            if (authorizationHeader && TOKEN_PATTERN.test(authorizationHeader)) {
              const accessToken = authorizationHeader.replace(TOKEN_PATTERN, '');

              if (accessToken.startsWith(API_TOKEN_PREFIX)) {
                const apiTokenAndUser = await getApiTokenAndUser(accessToken);

                if (apiTokenAndUser) {
                  const rateLimit = consumeRateLimit(apiTokenAndUser.apiToken, req.method);

                  res.set({
                    'RateLimit-Limit': rateLimit.limit,
                    'RateLimit-Remaining': rateLimit.remaining,
                    'RateLimit-Reset': rateLimit.resetInSeconds,
                  });

                  if (rateLimit.isExceeded) {
                    res.set('Retry-After', rateLimit.resetInSeconds);

                    return res.tooManyRequests('API token rate limit exceeded');
                  }

                  Object.assign(req, {
                    currentApiToken: apiTokenAndUser.apiToken,
                    currentUser: apiTokenAndUser.user,
                  });
                }

                return next();
              }

              const { httpOnlyToken } = req.cookies;

              const sessionAndUser = await getSessionAndUser(accessToken, httpOnlyToken);

              if (sessionAndUser) {
                const { session, user } = sessionAndUser;

                Object.assign(req, {
                  currentSession: session,
                  currentUser: user,
                });

                if (req.isSocket) {
                  sails.sockets.join(req, `@accessToken:${session.accessToken}`);
                  sails.sockets.join(req, `@user:${user.id}`);
                }
              }
            }

            return next();
          },
        },
        '/attachments/*': {
          async fn(req, res, next) {
            const { accessToken, httpOnlyToken } = req.cookies;

            if (accessToken) {
              const sessionAndUser = await getSessionAndUser(accessToken, httpOnlyToken);

              if (sessionAndUser) {
                const { session, user } = sessionAndUser;

                Object.assign(req, {
                  currentSession: session,
                  currentUser: user,
                });
              }
            }

            return next();
          },
        },
      },
    },
  };
};
