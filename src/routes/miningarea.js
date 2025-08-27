const express = require('express');
const router = express.Router();
const miningAreaController = require('../controllers/miningAreaController');

// GET /api/mining-area - Get all mining areas (GeoJSON)
router.get('/', miningAreaController.getMiningAreas);

// GET /api/mining-area/:zoneName/trucks - Get trucks in specific zone
router.get('/:zoneName/trucks', miningAreaController.getTrucksInZone);

// GET /api/mining-area/statistics - Get zone statistics
router.get('/statistics', miningAreaController.getZoneStatistics);

// GET /api/mining-area/activity - Get zone activity report
router.get('/activity', miningAreaController.getZoneActivityReport);

// GET /api/mining-area/trucks/:truckId/zones - Check which zones a truck is in
router.get('/trucks/:truckId/zones', miningAreaController.checkTruckInZones);

// GET /api/mining-area/nearby - Get nearby trucks
router.get('/nearby', miningAreaController.getNearbyTrucks);

// POST /api/mining-area - Create new mining zone
router.post('/', miningAreaController.createMiningZone);

// PUT /api/mining-area/:zoneId - Update mining zone
router.put('/:zoneId', miningAreaController.updateMiningZone);

// DELETE /api/mining-area/:zoneId - Delete/deactivate mining zone
router.delete('/:zoneId', miningAreaController.deleteMiningZone);

module.exports = router;