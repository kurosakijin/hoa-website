const express = require('express');
const {
  getLandingPageContent,
  updateLandingPageContent,
} = require('../services/contentService');

const router = express.Router();

router.get('/landing-page', async (_request, response, next) => {
  try {
    response.json(await getLandingPageContent());
  } catch (error) {
    next(error);
  }
});

router.put('/landing-page', async (request, response, next) => {
  try {
    response.json(await updateLandingPageContent(request.body));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
