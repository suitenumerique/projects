/**
 * ApiToken.js
 *
 * @description :: Long-lived personal access token used to call the REST API
 *                 from scripts and third-party integrations. Only the SHA-256
 *                 hash of the token is stored; the clear value is shown once.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    tokenHash: {
      type: 'string',
      required: true,
      columnName: 'token_hash',
    },
    tokenPrefix: {
      type: 'string',
      required: true,
      columnName: 'token_prefix',
    },
    lastUsedAt: {
      type: 'ref',
      columnName: 'last_used_at',
    },
    expiresAt: {
      type: 'ref',
      columnName: 'expires_at',
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    userId: {
      model: 'User',
      required: true,
      columnName: 'user_id',
    },
  },

  tableName: 'api_token',

  customToJSON() {
    return _.omit(this, ['tokenHash']);
  },
};
