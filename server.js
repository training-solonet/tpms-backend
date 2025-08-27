const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import services
const prismaService = require('./src/services/prismaService');
const websocketService = require('./src/services/websocketService');

// Import middlewares
const authMiddleware = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');
const rateLimiter = require('./src/middleware/rateLimiter');

// Import routes
const authRoutes = require('./src/routes/auth');
const truckRoutes = require('./src/routes/trucks');
const dashboardRoutes = require('./src/routes/dashboard');
const miningAreaRoutes = require('./src/routes/miningArea');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store io instance for use in other modules
app.set('socketio', io);

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==========================================
// MIDDLEWARE SETUP
// ==========================================

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin ${origin} not allowed`);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (only in production)
if (NODE_ENV === 'production') {
  app.use('/api/', rateLimiter);
}

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    next();
  });
}

// ==========================================
// DATABASE INITIALIZATION
// ==========================================

let isReady = false;

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing Prisma database connection...');
    
    // Connect to database
    await prismaService.connect();
    
    // Perform health check
    const health = await prismaService.healthCheck();
    if (health.status === 'healthy') {
      console.log('✅ Database connection healthy');
      isReady = true;
    } else {
      throw new Error(`Database health check failed: ${health.error}`);
    }
    
    // Get connection info
    const connectionInfo = await prismaService.getConnectionInfo();
    console.log(`📊 Database: ${connectionInfo.database_name}`);
    console.log(`🔌 Active connections: ${connectionInfo.active_connections}`);
    
    // Optimize database
    await prismaService.optimizeDatabase();
    console.log('⚡ Database optimization completed');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    isReady = false;
    
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// ==========================================
// WEBSOCKET SETUP
// ==========================================

websocketService.initialize(io);

io.on('connection', (socket) => {
  console.log(`📱 Client connected: ${socket.id}`);
  
  socket.on('subscribeToTruckUpdates', () => {
    socket.join('truck-updates');
    console.log(`🚛 Client ${socket.id} subscribed to truck updates`);
  });
  
  socket.on('subscribeToAlerts', () => {
    socket.join('alerts');
    console.log(`🚨 Client ${socket.id} subscribed to alerts`);
  });
  
  socket.on('disconnect', () => {
    console.log(`📱 Client disconnected: ${socket.id}`);
  });
});

// Start real-time data broadcast
const startRealtimeBroadcast = () => {
  setInterval(async () => {
    if (!isReady) return;
    
    try {
      // Broadcast truck location updates
      const locations = await prismaService.getRealtimeLocations();
      io.to('truck-updates').emit('trucksLocationUpdate', {
        type: 'location_update',
        data: locations,
        timestamp: new Date().toISOString()
      });
      
      // Check for new alerts
      const recentAlerts = await prismaService.prisma.truckAlert.findMany({
        where: {
          isResolved: false,
          createdAt: {
            gte: new Date(Date.now() - 60000) // Last minute
          }
        },
        include: {
          truck: {
            select: {
              truckNumber: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (recentAlerts.length > 0) {
        io.to('alerts').emit('newAlerts', {
          type: 'new_alerts',
          data: recentAlerts.map(alert => ({
            id: alert.id,
            type: alert.alertType,
            severity: alert.severity,
            message: alert.message,
            truckNumber: alert.truck.truckNumber,
            createdAt: alert.createdAt
          })),
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Real-time broadcast error:', error);
    }
  }, 30000); // Every 30 seconds
};

// ==========================================
// API ROUTES
// ==========================================

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = await prismaService.healthCheck();
  
  res.status(health.status === 'healthy' ? 200 : 503).json({
    status: health.status,
    timestamp: health.timestamp,
    database: health.status,
    server: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

// API status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const [connectionInfo, truckCount] = await Promise.all([
      prismaService.getConnectionInfo(),
      prismaService.prisma.truck.count()
    ]);
    
    res.json({
      success: true,
      data: {
        database: {
          name: connectionInfo.database_name,
          version: connectionInfo.db_version,
          connections: connectionInfo.active_connections
        },
        fleet: {
          totalTrucks: truckCount
        },
        server: {
          environment: NODE_ENV,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.env.npm_package_version || '1.0.0'
        },
        realtime: {
          connectedClients: io.engine.clientsCount,
          rooms: Object.keys(io.sockets.adapter.rooms)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get system status',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trucks', authMiddleware, truckRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/mining-area', authMiddleware, miningAreaRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Fleet Management API',
    version: '2.0.0',
    description: 'Mining truck fleet management system with Prisma integration',
    status: 'running',
    database: isReady ? 'connected' : 'connecting',
    endpoints: {
      health: '/health',
      status: '/api/status',
      auth: '/api/auth',
      trucks: '/api/trucks',
      dashboard: '/api/dashboard',
      miningArea: '/api/mining-area'
    },
    websocket: {
      enabled: true,
      events: ['trucksLocationUpdate', 'newAlerts', 'truckStatusUpdate']
    },
    documentation: 'https://github.com/your-repo/fleet-management-api'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/status',
      'POST /api/auth/login',
      'GET /api/trucks',
      'GET /api/dashboard/stats',
      'GET /api/mining-area'
    ]
  });
});

// Global error handler
app.use(errorHandler);

// ==========================================
// SERVER STARTUP
// ==========================================

const startServer = async () => {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Start server
    server.listen(PORT, () => {
      console.log('🚀 ================================');
      console.log(`🚛 Fleet Management API v2.0.0`);
      console.log('🚀 ================================');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
      console.log(`🏠 Base URL: http://localhost:${PORT}`);
      console.log('🚀 ================================');
      
      if (NODE_ENV === 'development') {
        console.log('🔧 Development mode features:');
        console.log('   • Detailed error messages');
        console.log('   • Request logging');
        console.log('   • CORS permissive mode');
        console.log('   • Prisma query logging');
        console.log(`   • Prisma Studio: npx prisma studio`);
        console.log('🚀 ================================');
      }
      
      // Start real-time broadcast
      startRealtimeBroadcast();
      console.log('📡 Real-time broadcasts started');
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

const gracefulShutdown = async (signal) => {
  console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close server
    server.close(() => {
      console.log('🔌 HTTP server closed');
    });
    
    // Close Socket.IO connections
    io.close(() => {
      console.log('📡 WebSocket connections closed');
    });
    
    // Disconnect Prisma
    await prismaService.disconnect();
    console.log('🗃️  Database connections closed');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// ==========================================
// START APPLICATION
// ==========================================

startServer();

// Export for testing
module.exports = { app, server, io };