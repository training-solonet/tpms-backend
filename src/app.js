const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['https://connectis.my.id', 'https://be-tpms.connectis.my.id', 'http://localhost:5173', 'http://localhost:3000'];

console.log('🔒 CORS allowed origins:', allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.originalUrl} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fleet Management Server is running',
    timestamp: new Date().toISOString(),
    server_ip: req.socket.localAddress,
    client_ip: req.ip,
    headers: Object.keys(req.headers),
    authorization_present: !!req.headers.authorization,
    query_params: req.query,
    full_url: req.url,
    original_url: req.originalUrl
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fleet Management API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/login',
      trucks: '/api/trucks',
      dashboard: '/api/dashboard/stats',
    },
    server_info: {
      server_ip: req.socket.localAddress,
      client_ip: req.ip,
      timestamp: new Date().toISOString(),
    },
  });
});

// Test route to verify API mounting
app.get('/api/test', (req, res) => {
  res.json({ message: 'API routes are working', timestamp: new Date().toISOString() });
});

// API routes
console.log('🔗 Mounting API routes on /api');
app.use('/api', routes);

// Routes listing removed for cleaner logs

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.originalUrl} not found`);
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'GET /',
      'POST /api/auth/login',
      'GET /api/trucks',
      'GET /api/dashboard/stats'
    ]
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
