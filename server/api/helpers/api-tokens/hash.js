const crypto = require('crypto');

module.exports = {
  sync: true,

  inputs: {
    token: {
      type: 'string',
      required: true,
    },
  },

  fn(inputs) {
    return crypto.createHash('sha256').update(inputs.token).digest('hex');
  },
};
