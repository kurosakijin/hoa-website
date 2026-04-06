const express = require('express');
const {
  createResident,
  deleteResident,
  listResidents,
  transferResidentLot,
  updateResident,
} = require('../services/hoaService');

const router = express.Router();

router.get('/', async (_request, response, next) => {
  try {
    response.json(await listResidents());
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  try {
    response.status(201).json(await createResident(request.body));
  } catch (error) {
    next(error);
  }
});

router.put('/:residentId', async (request, response, next) => {
  try {
    response.json(await updateResident(request.params.residentId, request.body));
  } catch (error) {
    next(error);
  }
});

router.post('/:residentId/transfer', async (request, response, next) => {
  try {
    response.status(201).json(await transferResidentLot(request.params.residentId, request.body));
  } catch (error) {
    next(error);
  }
});

router.delete('/:residentId', async (request, response, next) => {
  try {
    await deleteResident(request.params.residentId);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
