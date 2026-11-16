// Generates the user's API token. Each user has at most one: it must be revoked
// before a new one can be generated.

const Errors = {
  INVALID_EXPIRATION_DATE: {
    invalidExpirationDate: 'Invalid expiration date',
  },
  API_TOKEN_ALREADY_EXISTS: {
    apiTokenAlreadyExists: 'API token already exists, revoke it to generate a new one',
  },
};

module.exports = {
  inputs: {
    expiresAt: {
      type: 'string',
      allowNull: true,
    },
  },

  exits: {
    invalidExpirationDate: {
      responseType: 'unprocessableEntity',
    },
    apiTokenAlreadyExists: {
      responseType: 'conflict',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    let expiresAt = null;
    if (inputs.expiresAt) {
      const date = new Date(inputs.expiresAt);

      if (Number.isNaN(date.getTime()) || date <= new Date()) {
        throw Errors.INVALID_EXPIRATION_DATE;
      }

      expiresAt = date.toISOString();
    }

    const count = await ApiToken.count({
      userId: currentUser.id,
    });

    if (count > 0) {
      throw Errors.API_TOKEN_ALREADY_EXISTS;
    }

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
