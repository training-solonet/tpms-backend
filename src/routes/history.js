const express = require('express');
const router = express.Router();
const truckController = require('../controllers/truckController');

// This router is intended to be mounted at multiple base paths for frontend compatibility:
// - /api/location-history
// - /api/tracking
// - /api/vehicles
// It provides endpoints to fetch truck location history by plate number without duplicating base segments.

// GET /api/location-history/:plateNumber
router.get('/:plateNumber', truckController.getTruckLocationsByPlate);

// GET /api/tracking/:plateNumber/history
// GET /api/vehicles/:plateNumber/history
router.get('/:plateNumber/history', truckController.getTruckLocationsByPlate);

module.exports = router;
