const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

// GET /api/dashboard/stats - Get basic dashboard statistics (protected)
router.get('/stats', authMiddleware, dashboardController.getDashboardStats);

// GET /api/dashboard/fleet-summary - Get comprehensive fleet summary (protected)
router.get('/fleet-summary', authMiddleware, dashboardController.getFleetSummary);

// GET /api/dashboard/alerts - Get alert summary (protected)
router.get('/alerts', authMiddleware, dashboardController.getAlertSummary);

// GET /api/dashboard/fuel - Get fuel report (protected)
router.get('/fuel', authMiddleware, dashboardController.getFuelReport);

// GET /api/dashboard/maintenance - Get maintenance report (protected)
router.get('/maintenance', authMiddleware, dashboardController.getMaintenanceReport);

module.exports = router;