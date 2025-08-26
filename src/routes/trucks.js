const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const {
  getAllTrucks,
  getTruckById,
  getTruckTires,
  updateTruckStatus,
  getRealtimeLocations
} = require('../controllers/truckController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getAllTrucks);
router.get('/realtime/locations', getRealtimeLocations);
router.get('/:id', getTruckById);
router.get('/:id/tires', getTruckTires);
router.put('/:id/status', updateTruckStatus);

module.exports = router;