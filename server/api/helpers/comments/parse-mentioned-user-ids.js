// Mentions are stored in comment text as `@[Display name](userId)`.
const MENTION_TOKEN_REGEX = /@\[[^\]\n]+\]\((\d+)\)/g;

module.exports = {
  inputs: {
    text: {
      type: 'string',
      allowNull: true,
    },
  },

  sync: true,

  fn(inputs) {
    if (!inputs.text) {
      return [];
    }

    return _.uniq([...inputs.text.matchAll(MENTION_TOKEN_REGEX)].map(([, userId]) => userId));
  },
};
