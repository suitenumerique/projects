// Mentions are stored in comment text as `@[Display name](userId)`.
// In text fields they are shown as `@Display name` and converted back on submit.

const MENTION_TOKEN_REGEX = /@\[([^\]\n]+)\]\((\d+)\)/g;

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getMentionedUserIds = (text) => {
  if (!text) {
    return [];
  }

  const ids = new Set();

  text.replace(MENTION_TOKEN_REGEX, (match, name, id) => {
    ids.add(id);
    return match;
  });

  return [...ids];
};

// Splits stored text into strings and `{ name, userId }` mention parts.
export const splitMentions = (text) => {
  const parts = [];
  let lastIndex = 0;

  text.replace(MENTION_TOKEN_REGEX, (match, name, userId, offset) => {
    if (offset > lastIndex) {
      parts.push(text.slice(lastIndex, offset));
    }

    parts.push({ name, userId });
    lastIndex = offset + match.length;

    return match;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

export const toDisplayText = (text) => text.replace(MENTION_TOKEN_REGEX, '@$1');

// `users` is the list of mentionable users (`{ id, name }`).
// `pickedUsers` are the users explicitly chosen (in order) in the suggestions list or
// already mentioned in the comment: they win over a name lookup, so homonyms resolve
// to the right person. Each `@Name` occurrence takes the next picked user with that name.
export const toStorageText = (text, users, pickedUsers = []) => {
  const pickedByName = new Map();
  pickedUsers.forEach((user) => {
    if (!pickedByName.has(user.name)) {
      pickedByName.set(user.name, []);
    }
    pickedByName.get(user.name).push(user);
  });

  const byName = new Map();
  [...pickedUsers, ...users].forEach((user) => {
    if (user.name && !byName.has(user.name)) {
      byName.set(user.name, user);
    }
  });

  if (byName.size === 0) {
    return text;
  }

  // Longest names first, so `@Jean Dupont` is not matched as `@Jean`
  const names = [...byName.keys()].sort((a, b) => b.length - a.length);

  const regex = new RegExp(
    `(^|[^\\p{L}\\p{N}_[])@(${names.map(escapeRegExp).join('|')})(?![\\p{L}\\p{N}_])`,
    'gu',
  );

  const occurrences = new Map();

  return text.replace(regex, (match, prefix, name) => {
    const picked = pickedByName.get(name) || [];
    const index = occurrences.get(name) || 0;
    occurrences.set(name, index + 1);

    const user = picked[Math.min(index, picked.length - 1)] || byName.get(name);
    return `${prefix}@[${user.name}](${user.id})`;
  });
};

export const getMentionedUsers = (text) =>
  splitMentions(text)
    .filter((part) => typeof part !== 'string')
    .map((part) => ({ id: part.userId, name: part.name }));

const normalize = (string) =>
  string
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const filterUsersByQuery = (users, query, limit = 6) => {
  const normalizedQuery = normalize(query);

  return users
    .filter(
      (user) =>
        normalize(user.name || '').includes(normalizedQuery) ||
        (user.username && normalize(user.username).includes(normalizedQuery)),
    )
    .slice(0, limit);
};

// Returns the `@query` being typed right before the caret, if any.
export const getMentionQueryAtCaret = (text, caret) => {
  const match = /(^|\s)@([^\s@[\]]{0,30})$/.exec(text.slice(0, caret));

  if (!match) {
    return null;
  }

  return {
    query: match[2],
    start: caret - match[2].length - 1,
  };
};
