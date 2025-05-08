const express = require('express');
const reportController = require('../controllers/report.controller');

const router = express.Router();

router.get('/project/:projectId', reportController.getProjectSummary);
router.get('/trip/:tripId', reportController.getTripReport);

module.exports = router;
