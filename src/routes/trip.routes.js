const express = require('express');
const tripController = require('../controllers/trip.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router
  .route('/')
  .post(restrictTo('owner', 'admin'), tripController.createTrip);

router
  .route('/project/:projectId')
  .get(tripController.getProjectTrips);

router
  .route('/:tripId')
  .get(tripController.getTrip)
  .patch(restrictTo('owner', 'admin'), tripController.updateTrip)
  .delete(restrictTo('owner', 'admin'), tripController.deleteTrip);

module.exports = router;
