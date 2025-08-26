const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { getMiningAreas } = require('../controllers/miningAreaController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getMiningAreas);

module.exports = router;