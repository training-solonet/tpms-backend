const express = require('express');
const router = express.Router();
const truckController = require('../controllers/truckController');

// GET /api/trucks - Get all trucks with filters
router.get('/', truckController.getAllTrucks);

// GET /api/trucks/realtime/locations - Get real-time truck locations (GeoJSON)
router.get('/realtime/locations', truckController.getRealtimeLocations);

// GET /api/trucks/:id - Get specific truck details
router.get('/:id', truckController.getTruckById);

// GET /api/trucks/:id/tires - Get truck tire pressures
router.get('/:id/tires', truckController.getTruckTires);

// GET /api/trucks/:id/history - Get truck location history
router.get('/:id/history', truckController.getTruckLocationHistory);

// GET /api/trucks/:id/alerts - Get truck alerts
router.get('/:id/alerts', truckController.getTruckAlerts);

// PUT /api/trucks/:id/status - Update truck status
router.put('/:id/status', truckController.updateTruckStatus);

// PUT /api/trucks/:id/alerts/:alertId/resolve - Resolve truck alert
router.put('/:id/alerts/:alertId/resolve', truckController.resolveAlert);

// PUT /api/trucks/bulk/status - Bulk update truck status
router.put('/bulk/status', truckController.bulkUpdateTruckStatus);

module.exports = router;