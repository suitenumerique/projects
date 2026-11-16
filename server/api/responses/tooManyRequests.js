/**
 * tooManyRequests.js
 *
 * A custom response.
 *
 * Example usage:
 * ```
 *     return res.tooManyRequests();
 *     // -or-
 *     return res.tooManyRequests(optionalData);
 * ```
 */

module.exports = function tooManyRequests(message) {
  const { res } = this;

  return res.status(429).json({
    code: 'E_TOO_MANY_REQUESTS',
    message,
  });
};
