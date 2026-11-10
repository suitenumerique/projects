// Personal API tokens: lifecycle, authentication, and credential-management guard.

const { expect } = require('chai');

const BASE_URL = 'http://localhost:1337';

describe('api-tokens', () => {
  const USER_ID = '4000001';
  const OTHER_USER_ID = '4000002';
  const ADMIN_ID = '4000003';
  const USER_IDS = [USER_ID, OTHER_USER_ID, ADMIN_ID];

  let sessionToken;
  let otherSessionToken;
  let adminSessionToken;

  const request = (method, url, token, body) =>
    fetch(`${BASE_URL}${url}`, {
      method,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body && { 'Content-Type': 'application/json' }),
      },
      body: body && JSON.stringify(body),
    });

  const createSession = async (userId) => {
    const { token } = sails.helpers.utils.createJwtToken(userId);
    await Session.create({
      accessToken: token,
      httpOnlyToken: null,
      userId,
      remoteAddress: '127.0.0.1',
    });
    return token;
  };

  before(async () => {
    // The sails-disk test adapter generates numeric ids instead of the declared
    // string pks (see boardsDuplicate.test.js): pre-assign string ids.
    let idCounter = 4100000;
    const originalCreate = ApiToken.create.bind(ApiToken);
    ApiToken.create = (record, ...rest) => {
      idCounter += 1;
      return originalCreate({ id: String(idCounter), ...record }, ...rest);
    };

    await User.createEach([
      {
        id: USER_ID,
        email: 'api-token-user@example.net',
        password: 'api-token-password-1',
        name: 'API Token User',
      },
      {
        id: OTHER_USER_ID,
        email: 'api-token-other@example.net',
        password: 'api-token-password-2',
        name: 'Other User',
      },
      {
        id: ADMIN_ID,
        email: 'api-token-admin@example.net',
        password: 'api-token-password-3',
        name: 'Admin User',
        isAdmin: true,
      },
    ]);

    sessionToken = await createSession(USER_ID);
    otherSessionToken = await createSession(OTHER_USER_ID);
    adminSessionToken = await createSession(ADMIN_ID);
  });

  // Users can only have one token at a time: start every test without any.
  beforeEach(async () => {
    await ApiToken.destroy({ userId: USER_IDS });
  });

  after(async () => {
    await Promise.all([
      User.destroy(USER_IDS),
      Session.destroy({ userId: USER_IDS }),
      ApiToken.destroy({ userId: USER_IDS }),
    ]);
  });

  it('creates a token, returns its clear value once and never exposes the hash', async () => {
    const response = await request('POST', '/api/api-tokens', sessionToken);
    expect(response.status).to.equal(200);

    const body = await response.json();
    expect(body.included.token).to.match(/^prj_/);
    expect(body.item).to.not.have.property('tokenHash');
    expect(body.included.token.startsWith(body.item.tokenPrefix)).to.equal(true);

    const list = await (await request('GET', '/api/api-tokens', sessionToken)).json();
    expect(list.items).to.have.lengthOf(1);
    expect(list.items[0]).to.not.have.property('tokenHash');
    expect(JSON.stringify(list)).to.not.include(body.included.token);
  });

  it('authenticates API requests as the token owner', async () => {
    const created = await (await request('POST', '/api/api-tokens', sessionToken)).json();

    const response = await request('GET', '/api/users/me', created.included.token);
    expect(response.status).to.equal(200);
    expect((await response.json()).item.id).to.equal(USER_ID);
  });

  it('rejects unknown and expired tokens', async () => {
    expect((await request('GET', '/api/users/me', 'prj_doesnotexist')).status).to.equal(401);

    const created = await (await request('POST', '/api/api-tokens', sessionToken)).json();
    await ApiToken.updateOne({ id: created.item.id }).set({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    expect((await request('GET', '/api/users/me', created.included.token)).status).to.equal(401);
  });

  it('allows one token per user, to revoke before generating a new one', async () => {
    const first = await request('POST', '/api/api-tokens', sessionToken);
    expect(first.status).to.equal(200);
    const { item, included } = await first.json();

    expect((await request('POST', '/api/api-tokens', sessionToken)).status).to.equal(409);
    expect((await request('GET', '/api/users/me', included.token)).status).to.equal(200);

    // The limit is per user.
    expect((await request('POST', '/api/api-tokens', otherSessionToken)).status).to.equal(200);

    expect((await request('DELETE', `/api/api-tokens/${item.id}`, sessionToken)).status).to.equal(
      200,
    );
    expect((await request('POST', '/api/api-tokens', sessionToken)).status).to.equal(200);
  });

  it('refuses a past expiration date', async () => {
    const response = await request('POST', '/api/api-tokens', sessionToken, {
      expiresAt: '2000-01-01T00:00:00.000Z',
    });
    expect(response.status).to.equal(422);
  });

  it('does not let an API token manage credentials', async () => {
    const created = await (await request('POST', '/api/api-tokens', sessionToken)).json();
    const { token } = created.included;

    expect((await request('GET', '/api/api-tokens', token)).status).to.equal(403);
    expect((await request('POST', '/api/api-tokens', token)).status).to.equal(403);
    expect((await request('DELETE', `/api/api-tokens/${created.item.id}`, token)).status).to.equal(
      403,
    );
    expect((await request('DELETE', '/api/access-tokens/me', token)).status).to.equal(403);
  });

  it('lets an API token read users but never modify them, even as an admin', async () => {
    const created = await (await request('POST', '/api/api-tokens', adminSessionToken)).json();
    const { token } = created.included;

    expect((await request('GET', '/api/users/me', token)).status).to.equal(200);
    expect((await request('GET', `/api/users/${USER_ID}`, token)).status).to.equal(200);
    expect((await request('GET', '/api/users/search?query=api', token)).status).to.equal(200);

    expect(
      (
        await request('POST', '/api/users', token, {
          email: 'api-token-intruder@example.net',
          password: 'intruder-password-1',
          name: 'Intruder',
        })
      ).status,
    ).to.equal(403);
    expect((await request('DELETE', `/api/users/${USER_ID}`, token)).status).to.equal(403);
    expect(
      (await request('PATCH', `/api/users/${USER_ID}`, token, { isAdmin: true })).status,
    ).to.equal(403);
    expect((await request('PATCH', `/api/users/${ADMIN_ID}`, token)).status).to.equal(403);
    expect((await request('POST', `/api/users/${ADMIN_ID}/avatar`, token)).status).to.equal(403);

    expect(await User.findOne({ email: 'api-token-intruder@example.net' })).to.equal(undefined);
    expect((await User.findOne({ id: USER_ID })).isAdmin).to.equal(false);

    // The browser session keeps working for the same actions.
    expect((await request('PATCH', `/api/users/${ADMIN_ID}`, adminSessionToken)).status).to.equal(
      200,
    );
  });

  it('rate limits each API token separately for reads and writes, but not sessions', async () => {
    const { apiTokenRateLimitRead, apiTokenRateLimitWrite } = sails.config.custom;
    Object.assign(sails.config.custom, { apiTokenRateLimitRead: 3, apiTokenRateLimitWrite: 2 });

    try {
      const create = async (session) =>
        (await (await request('POST', '/api/api-tokens', session)).json()).included.token;
      const token = await create(sessionToken);
      const otherToken = await create(otherSessionToken);

      const read = () => request('GET', '/api/users/me', token);
      const write = () => request('PATCH', `/api/users/${USER_ID}`, token);

      const first = await read();
      expect(first.status).to.equal(200);
      expect(first.headers.get('RateLimit-Limit')).to.equal('3');
      expect(first.headers.get('RateLimit-Remaining')).to.equal('2');
      expect((await read()).status).to.equal(200);
      expect((await read()).status).to.equal(200);

      const limited = await read();
      expect(limited.status).to.equal(429);
      expect((await limited.json()).code).to.equal('E_TOO_MANY_REQUESTS');
      expect(Number(limited.headers.get('Retry-After'))).to.be.within(1, 60);

      // Writes have their own budget (these are 403 because tokens cannot edit users).
      expect((await write()).status).to.equal(403);
      expect((await write()).status).to.equal(403);
      expect((await write()).status).to.equal(429);

      // Other tokens and browser sessions are not affected.
      expect((await request('GET', '/api/users/me', otherToken)).status).to.equal(200);
      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        expect((await request('GET', '/api/users/me', sessionToken)).status).to.equal(200);
      }
    } finally {
      Object.assign(sails.config.custom, { apiTokenRateLimitRead, apiTokenRateLimitWrite });
    }
  });

  it('only lets the owner revoke a token, and revocation takes effect', async () => {
    const created = await (await request('POST', '/api/api-tokens', sessionToken)).json();
    const url = `/api/api-tokens/${created.item.id}`;

    expect((await request('DELETE', url, otherSessionToken)).status).to.equal(404);
    expect((await request('GET', '/api/users/me', created.included.token)).status).to.equal(200);

    expect((await request('DELETE', url, sessionToken)).status).to.equal(200);
    expect((await request('GET', '/api/users/me', created.included.token)).status).to.equal(401);
  });
});
