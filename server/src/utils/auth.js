const jwt = require('jsonwebtoken');

function getAdminConfig() {
  return {
    username: process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'admin',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    name: process.env.ADMIN_NAME || 'Homeowners Admin',
    secret: process.env.JWT_SECRET || 'hoa-development-secret',
  };
}

function signAdminToken() {
  const admin = getAdminConfig();

  return jwt.sign(
    {
      role: 'admin',
      username: admin.username,
      name: admin.name,
    },
    admin.secret,
    { expiresIn: '12h' }
  );
}

function verifyAdminToken(token) {
  return jwt.verify(token, getAdminConfig().secret);
}

module.exports = {
  getAdminConfig,
  signAdminToken,
  verifyAdminToken,
};
