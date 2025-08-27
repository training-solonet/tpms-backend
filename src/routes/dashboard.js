const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/stats - Get basic dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// GET /api/dashboard/fleet-summary - Get comprehensive fleet summary
router.get('/fleet-summary', dashboardController.getFleetSummary);

// GET /api/dashboard/alerts - Get alert summary
router.get('/alerts', dashboardController.getAlertSummary);

// GET /api/dashboard/fuel - Get fuel report
router.get('/fuel', dashboardController.getFuelReport);

// GET /api/dashboard/maintenance - Get maintenance report
router.get('/maintenance', dashboardController.getMaintenanceReport);

module.exports = router;