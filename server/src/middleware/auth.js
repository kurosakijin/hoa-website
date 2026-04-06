const { verifyAdminToken } = require('../utils/auth');

function requireAdmin(request, response, next) {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return response.status(401).json({ message: 'Admin authentication is required.' });
  }

  try {
    request.admin = verifyAdminToken(token);
    return next();
  } catch (error) {
    return response.status(401).json({ message: 'Your admin session is invalid or expired.' });
  }
}

module.exports = {
  requireAdmin,
};
