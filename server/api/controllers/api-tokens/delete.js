const Errors = {
  API_TOKEN_NOT_FOUND: {
    apiTokenNotFound: 'API token not found',
  },
};

module.exports = {
  inputs: {
    id: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
  },

  exits: {
    apiTokenNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const apiToken = await ApiToken.destroyOne({
      id: inputs.id,
      userId: currentUser.id,
    });

    if (!apiToken) {
      throw Errors.API_TOKEN_NOT_FOUND;
    }

    return {
      item: apiToken,
    };
  },
};
