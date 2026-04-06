const express = require('express');
const { getDashboardSummary } = require('../services/hoaService');

const router = express.Router();

router.get('/summary', async (_request, response, next) => {
  try {
    response.json(await getDashboardSummary());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
