const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { getAdminConfig, signAdminToken } = require('../utils/auth');

const router = express.Router();

router.post('/login', (request, response) => {
  const { username, password } = request.body || {};
  const admin = getAdminConfig();

  if (username !== admin.username || password !== admin.password) {
    return response.status(401).json({ message: 'Incorrect admin credentials.' });
  }

  return response.json({
    token: signAdminToken(),
    admin: {
      username: admin.username,
      name: admin.name,
    },
  });
});

router.get('/me', requireAdmin, (request, response) => {
  response.json({
    admin: request.admin,
  });
});

module.exports = router;
