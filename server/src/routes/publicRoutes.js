const express = require('express');
const { searchResidentInformation } = require('../services/hoaService');

const router = express.Router();

router.get('/resident-search', async (request, response, next) => {
  try {
    const result = await searchResidentInformation(request.query);

    if (!result) {
      return response.status(404).json({
        message: 'No resident record matched the provided details.',
      });
    }

    return response.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
