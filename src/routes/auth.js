const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');

// Debug middleware for auth routes
router.use((req, res, next) => {
  console.log(`🔐 Auth Router - ${req.method} ${req.originalUrl} ${req.path}`);
  next();
});

// POST /api/auth/login
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

// POST /api/auth/verify - verify token via POST body (proxy workaround)
router.post('/verify', authController.verifyTokenPost);

// GET /api/auth/me - verify token and return current user
router.get('/me', authMiddleware, authController.getCurrentUser);

// POST /api/auth/refresh (optional)
router.post('/refresh', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Token refresh not implemented yet',
  });
});

// POST /api/auth/logout (optional)
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

module.exports = router;
