const express = require('express');
const router = express.Router();
const truckController = require('../controllers/truckController');
const authMiddleware = require('../middleware/auth');

// GET /api/trucks - Get all trucks with filters (unprotected for frontend testing)
router.get('/', truckController.getAllTrucks);

// GET /api/trucks/protected - Get all trucks with filters (protected)
router.get('/protected', authMiddleware, truckController.getAllTrucks);

// GET /api/trucks/realtime/locations - Get real-time truck locations (GeoJSON) (unprotected for frontend testing)
router.get('/realtime/locations', truckController.getRealtimeLocations);

// GET /api/trucks/realtime/locations/protected - Get real-time truck locations (GeoJSON) (protected)
router.get('/realtime/locations/protected', authMiddleware, truckController.getRealtimeLocations);

// Place plateNumber route BEFORE generic :id to avoid conflicts
// GET /api/trucks/:plateNumber/locations - Get truck location history by plate number (unprotected for frontend testing)
router.get('/:plateNumber/locations', truckController.getTruckLocationsByPlate);

// GET /api/trucks/:plateNumber/history - Get truck location history by plate number (unprotected for frontend testing)
router.get('/:plateNumber/history', truckController.getTruckLocationsByPlate);

// GET /api/trucks/:id - Get specific truck details (protected)
router.get('/:id', authMiddleware, truckController.getTruckById);

// GET /api/trucks/:id/tires - Get truck tire pressures (protected)
router.get('/:id/tires', authMiddleware, truckController.getTruckTires);

// GET /api/trucks/:id/history/protected - Get truck location history (protected)
router.get('/:id/history/protected', authMiddleware, truckController.getTruckLocationHistory);

// GET /api/trucks/:id/alerts - Get truck alerts (protected)
router.get('/:id/alerts', authMiddleware, truckController.getTruckAlerts);

// PUT /api/trucks/:id/status - Update truck status (protected)
router.put('/:id/status', authMiddleware, truckController.updateTruckStatus);

// PUT /api/trucks/:id/alerts/:alertId/resolve - Resolve truck alert (protected)
router.put('/:id/alerts/:alertId/resolve', authMiddleware, truckController.resolveAlert);

// PUT /api/trucks/bulk/status - Bulk update truck status (protected)
router.put('/bulk/status', authMiddleware, truckController.bulkUpdateTruckStatus);

// Compatibility routes moved to src/routes/history.js and mounted in routes/index.js

module.exports = router;