const express = require('express');
const { upload } = require('../middleware/upload');
const {
  createPayment,
  deletePayment,
  getPaymentLotDetails,
  listPaymentLots,
  updatePayment,
} = require('../services/hoaService');
const { parseRequestPayload } = require('../utils/requestPayload');

const router = express.Router();

router.get('/lots', async (_request, response, next) => {
  try {
    response.json(await listPaymentLots());
  } catch (error) {
    next(error);
  }
});

router.get('/lots/:residentId/:lotId', async (request, response, next) => {
  try {
    response.json(await getPaymentLotDetails(request.params.residentId, request.params.lotId));
  } catch (error) {
    next(error);
  }
});

router.post('/', upload.single('receiptImage'), async (request, response, next) => {
  try {
    response.status(201).json(await createPayment(parseRequestPayload(request), { receiptImageFile: request.file }));
  } catch (error) {
    next(error);
  }
});

router.put('/:paymentId', upload.single('receiptImage'), async (request, response, next) => {
  try {
    response.json(
      await updatePayment(request.params.paymentId, parseRequestPayload(request), {
        receiptImageFile: request.file,
      })
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/:paymentId', async (request, response, next) => {
  try {
    await deletePayment(request.params.paymentId);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
