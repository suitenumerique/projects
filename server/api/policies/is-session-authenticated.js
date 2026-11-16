// Restricts an action to browser sessions: personal API tokens must not be able
// to manage credentials (create other tokens, change password/email, etc.).
module.exports = async function isSessionAuthenticated(req, res, proceed) {
  if (!req.currentSession) {
    return res.forbidden('This action requires a browser session');
  }

  return proceed();
};
