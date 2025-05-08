const express = require('express');
const participantController = require('../controllers/participant.controller');

const router = express.Router();

router
  .route('/')
  .post(participantController.createParticipant);

router
  .route('/trip/:tripId')
  .get(participantController.getTripParticipants);

router
  .route('/:participantId')
  .get(participantController.getParticipant)
  .patch(participantController.updateParticipant)
  .delete(participantController.deleteParticipant);

module.exports = router;
