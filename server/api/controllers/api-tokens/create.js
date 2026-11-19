// Generates the user's API token. Each user has at most one: it must be revoked
// before a new one can be generated.

// Tokens always expire: only these lifetimes (in days) can be chosen.
const EXPIRATION_DAYS = [30, 90];
const DEFAULT_EXPIRATION_DAYS = 90;

const Errors = {
  API_TOKEN_ALREADY_EXISTS: {
    apiTokenAlreadyExists: 'API token already exists, revoke it to generate a new one',
  },
};

module.exports = {
  inputs: {
    expiresInDays: {
      type: 'number',
      isIn: EXPIRATION_DAYS,
      defaultsTo: DEFAULT_EXPIRATION_DAYS,
    },
  },

  exits: {
    apiTokenAlreadyExists: {
      responseType: 'conflict',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const count = await ApiToken.count({
      userId: currentUser.id,
    });

    if (count > 0) {
      throw Errors.API_TOKEN_ALREADY_EXISTS;
    }

    const expiresAt = new Date(
      Date.now() + inputs.expiresInDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { token, tokenHash, tokenPrefix } = sails.helpers.apiTokens.generate();

    const apiToken = await ApiToken.create({
      tokenHash,
      tokenPrefix,
      expiresAt,
      userId: currentUser.id,
    }).fetch();

    return {
      item: apiToken,
      included: {
        // Clear value, returned only once.
        token,
      },
    };
  },
};
