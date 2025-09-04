const express = require('express');
const authRoutes = require('./auth');
const truckRoutes = require('./trucks');
const dashboardRoutes = require('./dashboard');
const miningAreaRoutes = require('./miningarea');
const sensorRoutes = require('./sensors');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/trucks', truckRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/mining-area', miningAreaRoutes);
router.use('/sensors', sensorRoutes);

module.exports = router;