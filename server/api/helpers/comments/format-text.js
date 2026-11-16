// Turns stored comment text into safe HTML for emails (mentions shown as `@Name`).
const MENTION_TOKEN_REGEX = /@\[([^\]\n]+)\]\(\d+\)/g;

module.exports = {
  inputs: {
    text: {
      type: 'string',
      required: true,
    },
  },

  sync: true,

  fn(inputs) {
    return _.escape(inputs.text.replace(MENTION_TOKEN_REGEX, '@$1')).replace(/\n/g, '<br>');
  },
};
