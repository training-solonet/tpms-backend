const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Update CORS configuration untuk mengizinkan akses dari IP manapun
const io = socketIo(server, {
  cors: {
    origin: "*", // Atau specify IP range: ["http://192.168.1.*", "http://localhost:5173"]
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fleet_management',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Middleware - Update CORS untuk network access
app.use(cors({
  origin: "*", // Izinkan dari semua origin untuk testing
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Add logging middleware untuk debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fleet_secret_key_2024';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

// Add health check endpoint tanpa auth
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fleet Management Server is running',
    timestamp: new Date().toISOString(),
    server_ip: req.socket.localAddress,
    client_ip: req.ip
  });
});

// Add root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fleet Management API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/login',
      trucks: '/api/trucks',
      dashboard: '/api/dashboard/stats'
    },
    server_info: {
      server_ip: req.socket.localAddress,
      client_ip: req.ip,
      timestamp: new Date().toISOString()
    }
  });
});

// Generate dummy data for 1000 trucks
const generateDummyTrucks = () => {
  const trucks = [];
  const statuses = ['active', 'inactive', 'maintenance'];
  const models = ['CAT 797F', 'Komatsu 980E', 'Liebherr T284', 'CAT 789D', 'Komatsu 830E'];
  
  // Mining area boundaries (example coordinates for a large mining site)
  const miningBounds = {
    minLat: -6.8000,
    maxLat: -6.7000,
    minLng: 107.1000,
    maxLng: 107.2000
  };

  for (let i = 1; i <= 1000; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const lat = miningBounds.minLat + Math.random() * (miningBounds.maxLat - miningBounds.minLat);
    const lng = miningBounds.minLng + Math.random() * (miningBounds.maxLng - miningBounds.minLng);
    
    // Generate tire pressure data (6 tires per truck)
    const tirePressures = [];
    for (let j = 1; j <= 6; j++) {
      tirePressures.push({
        tireId: j,
        position: ['front_left', 'front_right', 'middle_left', 'middle_right', 'rear_left', 'rear_right'][j-1],
        pressure: Math.round((80 + Math.random() * 40) * 10) / 10, // 80-120 PSI
        status: Math.random() > 0.1 ? 'normal' : (Math.random() > 0.5 ? 'low' : 'high'),
        lastUpdated: new Date()
      });
    }

    trucks.push({
      id: i,
      truckNumber: `T${String(i).padStart(4, '0')}`,
      model: models[Math.floor(Math.random() * models.length)],
      status: status,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      speed: status === 'active' ? Math.round(Math.random() * 60) : 0, // km/h
      heading: Math.round(Math.random() * 360), // degrees
      fuel: Math.round(Math.random() * 100), // percentage
      payload: status === 'active' ? Math.round(Math.random() * 400) : 0, // tons
      driver: status === 'active' ? `Driver ${i}` : null,
      lastUpdate: new Date(),
      tirePressures: tirePressures,
      engineHours: Math.round(Math.random() * 10000),
      odometer: Math.round(Math.random() * 100000),
      alerts: status === 'maintenance' ? ['Engine warning', 'Scheduled maintenance'] : []
    });
  }
  
  return trucks;
};

// In-memory storage for demo (in production, use PostgreSQL)
let trucksData = generateDummyTrucks();

// Mining area GeoJSON
const miningArea = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Main Mining Zone",
        zone_type: "extraction"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [107.1000, -6.8000],
          [107.2000, -6.8000],
          [107.2000, -6.7000],
          [107.1000, -6.7000],
          [107.1000, -6.8000]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Processing Area",
        zone_type: "processing"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [107.1200, -6.7800],
          [107.1800, -6.7800],
          [107.1800, -6.7200],
          [107.1200, -6.7200],
          [107.1200, -6.7800]
        ]]
      }
    }
  ]
};

// Routes

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple auth for demo (use proper password hashing in production)
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign(
      { 
        userId: 1, 
        username: 'admin',
        role: 'operator' 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: 1,
          username: 'admin',
          role: 'operator'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Get all trucks with filtering and pagination
app.get('/api/trucks', authenticateToken, (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 50, 
      search,
      minFuel,
      maxFuel,
      hasAlerts
    } = req.query;
    
    let filteredTrucks = trucksData;
    
    // Apply filters
    if (status && status !== 'all') {
      filteredTrucks = filteredTrucks.filter(truck => truck.status === status);
    }
    
    if (search) {
      filteredTrucks = filteredTrucks.filter(truck => 
        truck.truckNumber.toLowerCase().includes(search.toLowerCase()) ||
        truck.model.toLowerCase().includes(search.toLowerCase()) ||
        (truck.driver && truck.driver.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (minFuel) {
      filteredTrucks = filteredTrucks.filter(truck => truck.fuel >= parseInt(minFuel));
    }
    
    if (maxFuel) {
      filteredTrucks = filteredTrucks.filter(truck => truck.fuel <= parseInt(maxFuel));
    }
    
    if (hasAlerts === 'true') {
      filteredTrucks = filteredTrucks.filter(truck => truck.alerts.length > 0);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTrucks = filteredTrucks.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      data: {
        trucks: paginatedTrucks,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: filteredTrucks.length,
          total_pages: Math.ceil(filteredTrucks.length / limit)
        },
        summary: {
          total_trucks: trucksData.length,
          active: trucksData.filter(t => t.status === 'active').length,
          inactive: trucksData.filter(t => t.status === 'inactive').length,
          maintenance: trucksData.filter(t => t.status === 'maintenance').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get truck by ID
app.get('/api/trucks/:id', authenticateToken, (req, res) => {
  try {
    const truckId = parseInt(req.params.id);
    const truck = trucksData.find(t => t.id === truckId);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: truck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get truck tire pressures
app.get('/api/trucks/:id/tires', authenticateToken, (req, res) => {
  try {
    const truckId = parseInt(req.params.id);
    const truck = trucksData.find(t => t.id === truckId);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        truckId: truck.id,
        truckNumber: truck.truckNumber,
        tirePressures: truck.tirePressures,
        lastUpdated: truck.lastUpdate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get mining area boundaries
app.get('/api/mining-area', authenticateToken, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: miningArea
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Real-time truck locations (GeoJSON format)
app.get('/api/trucks/realtime/locations', authenticateToken, (req, res) => {
  try {
    const { status } = req.query;
    
    let filteredTrucks = trucksData;
    if (status && status !== 'all') {
      filteredTrucks = filteredTrucks.filter(truck => truck.status === status);
    }
    
    const geoJsonData = {
      type: "FeatureCollection",
      features: filteredTrucks.map(truck => ({
        type: "Feature",
        properties: {
          id: truck.id,
          truckNumber: truck.truckNumber,
          model: truck.model,
          status: truck.status,
          speed: truck.speed,
          heading: truck.heading,
          fuel: truck.fuel,
          payload: truck.payload,
          driver: truck.driver,
          lastUpdate: truck.lastUpdate,
          alertCount: truck.alerts.length
        },
        geometry: truck.location
      }))
    };
    
    res.status(200).json({
      success: true,
      data: geoJsonData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const stats = {
      totalTrucks: trucksData.length,
      activeTrucks: trucksData.filter(t => t.status === 'active').length,
      inactiveTrucks: trucksData.filter(t => t.status === 'inactive').length,
      maintenanceTrucks: trucksData.filter(t => t.status === 'maintenance').length,
      averageFuel: Math.round(trucksData.reduce((sum, t) => sum + t.fuel, 0) / trucksData.length),
      totalPayload: trucksData.reduce((sum, t) => sum + t.payload, 0),
      alertsCount: trucksData.reduce((sum, t) => sum + t.alerts.length, 0),
      lowTirePressureCount: trucksData.filter(truck => 
        truck.tirePressures.some(tire => tire.status === 'low')
      ).length
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update truck status
app.put('/api/trucks/:id/status', authenticateToken, (req, res) => {
  try {
    const truckId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or maintenance'
      });
    }
    
    const truckIndex = trucksData.findIndex(t => t.id === truckId);
    if (truckIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    trucksData[truckIndex].status = status;
    trucksData[truckIndex].lastUpdate = new Date();
    
    // Broadcast update to all connected clients
    io.emit('truckStatusUpdate', {
      truckId: truckId,
      status: status,
      timestamp: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Truck status updated successfully',
      data: trucksData[truckIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// WebSocket handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User ${socket.user.username} connected from ${socket.handshake.address}`);
  
  socket.on('subscribeToTruckUpdates', () => {
    socket.join('truckUpdates');
    console.log(`User ${socket.user.username} subscribed to truck updates`);
  });
  
  socket.on('unsubscribeFromTruckUpdates', () => {
    socket.leave('truckUpdates');
    console.log(`User ${socket.user.username} unsubscribed from truck updates`);
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.username} disconnected`);
  });
});

// Simulate real-time truck movement and updates
const simulateRealTimeUpdates = () => {
  setInterval(() => {
    // Update random trucks (simulate movement and data changes)
    const trucksToUpdate = Math.floor(Math.random() * 50) + 10; // Update 10-60 trucks
    
    for (let i = 0; i < trucksToUpdate; i++) {
      const randomIndex = Math.floor(Math.random() * trucksData.length);
      const truck = trucksData[randomIndex];
      
      if (truck.status === 'active') {
        // Simulate movement (small random displacement)
        const currentLng = truck.location.coordinates[0];
        const currentLat = truck.location.coordinates[1];
        
        truck.location.coordinates[0] = currentLng + (Math.random() - 0.5) * 0.001;
        truck.location.coordinates[1] = currentLat + (Math.random() - 0.5) * 0.001;
        truck.speed = Math.round(Math.random() * 60);
        truck.heading = (truck.heading + (Math.random() - 0.5) * 30) % 360;
        truck.fuel = Math.max(0, truck.fuel - Math.random() * 0.5);
        truck.lastUpdate = new Date();
        
        // Occasionally update tire pressures
        if (Math.random() < 0.1) {
          truck.tirePressures.forEach(tire => {
            tire.pressure += (Math.random() - 0.5) * 2;
            tire.pressure = Math.max(60, Math.min(140, tire.pressure));
            tire.status = tire.pressure < 80 ? 'low' : tire.pressure > 120 ? 'high' : 'normal';
            tire.lastUpdated = new Date();
          });
        }
      }
    }
    
    // Broadcast updates to subscribed clients
    io.to('truckUpdates').emit('trucksLocationUpdate', {
      timestamp: new Date(),
      updatedCount: trucksToUpdate
    });
    
  }, 5000); // Update every 5 seconds
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    available_endpoints: {
      health: '/health',
      root: '/',
      auth: '/api/auth/login',
      trucks: '/api/trucks',
      dashboard: '/api/dashboard/stats'
    }
  });
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`🚛 Fleet Management Server running on http://${HOST}:${PORT}`);
  console.log(`📡 WebSocket server ready for real-time tracking`);
  console.log(`🌐 Server accessible from network at http://[YOUR_IP]:${PORT}`);
  
  // Show network interfaces
  const os = require('os');
  const interfaces = os.networkInterfaces();
  console.log('\n📋 Available network addresses:');
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`   • http://${interface.address}:${PORT}`);
      }
    }
  }
  console.log('');
  
  // Start real-time simulation
  simulateRealTimeUpdates();
});

module.exports = app;