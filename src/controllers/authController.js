const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/database');
const { logAdminActivity, logAdminOperation, logSecurityEvent } = require('../utils/adminLogger');
const { broadcastAdminActivity } = require('../services/websocketService');

const JWT_SECRET = process.env.JWT_SECRET || 'fleet-management-secret-key-change-in-production';

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username or email
    const userQuery = `
      SELECT id, username, email, password_hash, role, is_active
      FROM users 
      WHERE (username = $1 OR email = $1) AND is_active = true
    `;

    const result = await pool.query(userQuery, [username]);

    if (result.rows.length === 0) {
      // Log failed login attempt
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
        username,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        reason: 'User not found'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Check password - for demo purposes, we'll accept 'admin123' for both users
    const isValidPassword = password === 'admin123' || await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Log failed login attempt - wrong password
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
        username: user.username,
        userId: user.id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        reason: 'Invalid password'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login (optional)
    await pool.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Log successful admin login
    logAdminOperation('USER_LOGIN', user.id, {
      username: user.username,
      role: user.role,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      loginTime: new Date().toISOString(),
      sessionDuration: '24h'
    });

    // Log admin activity for real-time monitoring
    const adminActivityData = {
      adminId: user.id,
      adminUsername: user.username,
      adminRole: user.role,
      clientIp: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      loginMethod: 'web_frontend',
      tokenExpiry: '24h'
    };

    logAdminActivity('ADMIN_LOGIN_SUCCESS', adminActivityData);

    // Broadcast admin login activity via WebSocket for real-time monitoring
    broadcastAdminActivity({
      type: 'admin_login',
      action: 'ADMIN_LOGIN_SUCCESS',
      admin: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      details: {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        loginTime: new Date().toISOString(),
        method: 'web_frontend'
      }
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    req.user = user;
    next();
  });
};

const getCurrentUser = async (req, res) => {
  try {
    const userQuery = `
      SELECT id, username, email, role, created_at, updated_at
      FROM users 
      WHERE id = $1 AND is_active = true
    `;

    const result = await pool.query(userQuery, [req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  verifyToken,
  getCurrentUser
};