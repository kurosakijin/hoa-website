const jwt = require('jsonwebtoken');

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for admin authentication.`);
  }

  return value;
}

function getAdminConfig() {
  return {
    username: requireEnv('ADMIN_USERNAME'),
    password: requireEnv('ADMIN_PASSWORD'),
    name: process.env.ADMIN_NAME || 'Homeowners Admin',
    secret: requireEnv('JWT_SECRET'),
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
