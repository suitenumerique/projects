const crypto = require('crypto');

// Recognisable prefix so leaked tokens can be spotted by secret scanners
// and told apart from session JWTs in the Authorization header.
const PREFIX = 'prj_';
const DISPLAYED_PREFIX_LENGTH = PREFIX.length + 6;

module.exports = {
  sync: true,

  fn() {
    const token = `${PREFIX}${crypto.randomBytes(32).toString('base64url')}`;

    return {
      token,
      tokenHash: sails.helpers.apiTokens.hash(token),
      tokenPrefix: token.slice(0, DISPLAYED_PREFIX_LENGTH),
    };
  },
};
