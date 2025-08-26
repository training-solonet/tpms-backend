const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', getDashboardStats);

module.exports = router;