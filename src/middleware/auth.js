const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

const authMiddleware = (req, res, next) => {
  try {
    // Debug all headers to check if Authorization is being stripped
    console.log('🔒 Auth: All headers:', Object.keys(req.headers));
    console.log('🔒 Auth: Authorization variants:', {
      authorization: req.headers.authorization,
      Authorization: req.headers.Authorization,
      'x-authorization': req.headers['x-authorization'],
      'x-forwarded-authorization': req.headers['x-forwarded-authorization'],
      'x-auth-token': req.headers['x-auth-token'],
      'X-Auth-Token': req.headers['X-Auth-Token']
    });
    console.log('🔒 Auth: Query params:', {
      token: req.query.token ? req.query.token.substring(0, 12) + '...' : undefined,
      access_token: req.query.access_token ? req.query.access_token.substring(0, 12) + '...' : undefined
    });

    // Get token from header, query parameter, OR request body (workaround for aggressive proxy)
    // Note: Express.js converts all headers to lowercase
    const authHeader = req.headers.authorization || 
                      req.headers['x-authorization'] ||
                      req.headers['x-forwarded-authorization'] ||
                      req.headers['x-auth-token'] ||
                      req.headers['x-api-key'] ||
                      req.headers['x-token'] ||
                      req.headers['x-access-token'] ||
                      req.headers['x-auth-backup'] ||  // Cloudflare Worker backup
                      req.headers['x-original-authorization'] || // Cloudflare Transform Rule
                      (req.query.token ? `Bearer ${req.query.token}` : null) ||
                      (req.query.access_token ? `Bearer ${req.query.access_token}` : null) ||
                      (req.body && req.body.token ? `Bearer ${req.body.token}` : null) ||
                      (req.body && req.body.access_token ? `Bearer ${req.body.access_token}` : null);
    if (!authHeader) {
      console.log('🔒 Auth: Missing Authorization header');
    } else {
      console.log('🔒 Auth: Authorization header present, starts with:', authHeader.substring(0, 10));
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.',
      });
    }

    // Extract token
    const token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix
    // Minimal token diagnostics
    console.log('🔒 Auth: token length:', token.length, 'prefix:', token.substring(0, 12));

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is missing.',
      });
    }

    // Verify token using centralized secret
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      console.log('🔒 Auth: JWT verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error occurred.',
    });
  }
};

// Optional middleware for role-based access
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
