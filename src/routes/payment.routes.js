const express = require('express');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

router
  .route('/')
  .post(paymentController.createPayment);

router
  .route('/trip/:tripId')
  .get(paymentController.getTripPayments);

router
  .route('/participant/:participantId')
  .get(paymentController.getParticipantPayments);

router
  .route('/:paymentId')
  .get(paymentController.getPayment)
  .patch(paymentController.updatePayment)
  .delete(paymentController.deletePayment);

module.exports = router;
