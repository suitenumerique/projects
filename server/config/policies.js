/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  /**
   *
   * Default policy for all controllers and actions, unless overridden.
   * (`true` allows public access)
   *
   */

  '*': 'is-authenticated',

  'stats/index': 'is-stats-authorized',

  // API tokens can read users (users/show, users/search) but never modify them.
  'users/create': ['is-authenticated', 'is-session-authenticated', 'is-admin'],
  'users/delete': ['is-authenticated', 'is-session-authenticated', 'is-admin'],
  'users/update': ['is-authenticated', 'is-session-authenticated'],
  'users/update-avatar': ['is-authenticated', 'is-session-authenticated'],
  'users/update-email': ['is-authenticated', 'is-session-authenticated'],
  'users/update-password': ['is-authenticated', 'is-session-authenticated'],
  'users/update-username': ['is-authenticated', 'is-session-authenticated'],

  'access-tokens/delete': ['is-authenticated', 'is-session-authenticated'],

  'api-tokens/index': ['is-authenticated', 'is-session-authenticated'],
  'api-tokens/create': ['is-authenticated', 'is-session-authenticated'],
  'api-tokens/delete': ['is-authenticated', 'is-session-authenticated'],

  robots: true,
  'show-config': true,
  'access-tokens/create': true,
  'access-tokens/exchange-using-oidc': true,
  'boards/show': 'allow-public-board-access',
};
