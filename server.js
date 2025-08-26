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
  password: process.env.DB_PASSWORD || 'truk1234',
  port: process.env.DB_PORT || 5432,
});

// Test database connection on startup
pool.connect()
  .then(client => {
    console.log('✅ Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
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

// Mining area GeoJSON (static data)
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

// Get all trucks with filtering and pagination - FROM DATABASE
app.get('/api/trucks', authenticateToken, async (req, res) => {
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
    
    let query = `
      SELECT 
        t.id,
        t.truck_number as "truckNumber",
        t.status,
        t.latitude,
        t.longitude,
        t.speed,
        t.heading,
        t.fuel_percentage as fuel,
        t.payload_tons as payload,
        t.driver_name as driver,
        t.engine_hours as "engineHours",
        t.odometer,
        t.last_maintenance as "lastMaintenance",
        t.updated_at as "lastUpdate",
        tm.name as model_name,
        tm.manufacturer,
        (SELECT COUNT(*) FROM truck_alerts ta WHERE ta.truck_id = t.id AND ta.is_resolved = false) as alert_count
      FROM trucks t
      LEFT JOIN truck_models tm ON t.model_id = tm.id
      WHERE t.latitude IS NOT NULL AND t.longitude IS NOT NULL
    `;
    
    const queryParams = [];
    let paramCount = 0;
    
    // Apply filters
    if (status && status !== 'all') {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (t.truck_number ILIKE $${paramCount} OR tm.name ILIKE $${paramCount} OR t.driver_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }
    
    if (minFuel) {
      paramCount++;
      query += ` AND t.fuel_percentage >= $${paramCount}`;
      queryParams.push(parseInt(minFuel));
    }
    
    if (maxFuel) {
      paramCount++;
      query += ` AND t.fuel_percentage <= $${paramCount}`;
      queryParams.push(parseInt(maxFuel));
    }
    
    if (hasAlerts === 'true') {
      query += ` AND EXISTS (SELECT 1 FROM truck_alerts ta WHERE ta.truck_id = t.id AND ta.is_resolved = false)`;
    }
    
    // Get total count before pagination
    const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered_trucks`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Add pagination
    query += ` ORDER BY t.updated_at DESC`;
    const offset = (page - 1) * limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);
    
    // Execute main query
    const result = await pool.query(query, queryParams);
    
    // Transform data to match frontend format
    const trucks = result.rows.map(row => ({
      id: row.id,
      truckNumber: row.truckNumber,
      model: row.model_name,
      manufacturer: row.manufacturer,
      status: row.status,
      location: {
        type: 'Point',
        coordinates: [parseFloat(row.longitude || 0), parseFloat(row.latitude || 0)]
      },
      speed: parseFloat(row.speed) || 0,
      heading: parseInt(row.heading) || 0,
      fuel: parseFloat(row.fuel) || 0,
      payload: parseFloat(row.payload) || 0,
      driver: row.driver,
      engineHours: parseInt(row.engineHours) || 0,
      odometer: parseInt(row.odometer) || 0,
      lastMaintenance: row.lastMaintenance,
      lastUpdate: row.lastUpdate,
      alerts: [],
      alertCount: parseInt(row.alert_count) || 0
    }));
    
    // Get summary stats
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
      FROM trucks
    `);
    
    const summary = summaryResult.rows[0];
    
    res.status(200).json({
      success: true,
      data: {
        trucks: trucks,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: totalCount,
          total_pages: Math.ceil(totalCount / limit)
        },
        summary: {
          total_trucks: parseInt(summary.total),
          active: parseInt(summary.active),
          inactive: parseInt(summary.inactive),
          maintenance: parseInt(summary.maintenance)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get truck by ID - FROM DATABASE
app.get('/api/trucks/:id', authenticateToken, async (req, res) => {
  try {
    const truckId = parseInt(req.params.id);
    
    const query = `
      SELECT 
        t.id,
        t.truck_number as "truckNumber",
        t.status,
        t.latitude,
        t.longitude,
        t.speed,
        t.heading,
        t.fuel_percentage as fuel,
        t.payload_tons as payload,
        t.driver_name as driver,
        t.engine_hours as "engineHours",
        t.odometer,
        t.last_maintenance as "lastMaintenance",
        t.updated_at as "lastUpdate",
        tm.name as model_name,
        tm.manufacturer,
        tm.capacity_tons as capacity,
        tm.fuel_tank_capacity as fuel_tank
      FROM trucks t
      LEFT JOIN truck_models tm ON t.model_id = tm.id
      WHERE t.id = $1
    `;
    
    const result = await pool.query(query, [truckId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    const row = result.rows[0];
    
    // Get tire pressures
    const tireQuery = `
      SELECT 
        tire_position as position,
        tire_number as "tireNumber",
        pressure_psi as pressure,
        status,
        temperature,
        recorded_at as "lastUpdated"
      FROM tire_pressures 
      WHERE truck_id = $1 
      ORDER BY tire_number
    `;
    
    const tireResult = await pool.query(tireQuery, [truckId]);
    
    // Get alerts
    const alertQuery = `
      SELECT 
        alert_type as type,
        severity,
        message,
        is_resolved as "isResolved",
        created_at as "createdAt"
      FROM truck_alerts 
      WHERE truck_id = $1 
      ORDER BY created_at DESC
    `;
    
    const alertResult = await pool.query(alertQuery, [truckId]);
    
    const truck = {
      id: row.id,
      truckNumber: row.truckNumber,
      model: row.model_name,
      manufacturer: row.manufacturer,
      capacity: row.capacity,
      fuelTank: row.fuel_tank,
      status: row.status,
      location: {
        type: 'Point',
        coordinates: [parseFloat(row.longitude || 0), parseFloat(row.latitude || 0)]
      },
      speed: parseFloat(row.speed) || 0,
      heading: parseInt(row.heading) || 0,
      fuel: parseFloat(row.fuel) || 0,
      payload: parseFloat(row.payload) || 0,
      driver: row.driver,
      engineHours: parseInt(row.engineHours) || 0,
      odometer: parseInt(row.odometer) || 0,
      lastMaintenance: row.lastMaintenance,
      lastUpdate: row.lastUpdate,
      tirePressures: tireResult.rows,
      alerts: alertResult.rows
    };
    
    res.status(200).json({
      success: true,
      data: truck
    });
  } catch (error) {
    console.error('Error fetching truck:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get truck tire pressures - FROM DATABASE
app.get('/api/trucks/:id/tires', authenticateToken, async (req, res) => {
  try {
    const truckId = parseInt(req.params.id);
    
    // Get truck info
    const truckQuery = `
      SELECT truck_number as "truckNumber"
      FROM trucks 
      WHERE id = $1
    `;
    
    const truckResult = await pool.query(truckQuery, [truckId]);
    
    if (truckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    // Get tire pressures
    const tireQuery = `
      SELECT 
        tire_position as position,
        tire_number as "tireNumber",
        pressure_psi as pressure,
        status,
        temperature,
        recorded_at as "lastUpdated"
      FROM tire_pressures 
      WHERE truck_id = $1 
      ORDER BY tire_number
    `;
    
    const tireResult = await pool.query(tireQuery, [truckId]);
    
    res.status(200).json({
      success: true,
      data: {
        truckId: truckId,
        truckNumber: truckResult.rows[0].truckNumber,
        tirePressures: tireResult.rows,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching tire pressures:', error);
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

// Real-time truck locations (GeoJSON format) - FROM DATABASE
app.get('/api/trucks/realtime/locations', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        t.id,
        t.truck_number as "truckNumber",
        t.status,
        t.latitude,
        t.longitude,
        t.speed,
        t.heading,
        t.fuel_percentage as fuel,
        t.payload_tons as payload,
        t.driver_name as driver,
        t.updated_at as "lastUpdate",
        tm.name as model,
        (SELECT COUNT(*) FROM truck_alerts ta WHERE ta.truck_id = t.id AND ta.is_resolved = false) as alert_count
      FROM trucks t
      LEFT JOIN truck_models tm ON t.model_id = tm.id
      WHERE t.latitude IS NOT NULL AND t.longitude IS NOT NULL
    `;
    
    const queryParams = [];
    
    if (status && status !== 'all') {
      query += ` AND t.status = $1`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY t.updated_at DESC`;
    
    const result = await pool.query(query, queryParams);
    
    const geoJsonData = {
      type: "FeatureCollection",
      features: result.rows.map(row => ({
        type: "Feature",
        properties: {
          id: row.id,
          truckNumber: row.truckNumber,
          model: row.model,
          status: row.status,
          speed: parseFloat(row.speed) || 0,
          heading: parseInt(row.heading) || 0,
          fuel: parseFloat(row.fuel) || 0,
          payload: parseFloat(row.payload) || 0,
          driver: row.driver,
          lastUpdate: row.lastUpdate,
          alertCount: parseInt(row.alert_count) || 0
        },
        geometry: {
          type: "Point",
          coordinates: [parseFloat(row.longitude || 0), parseFloat(row.latitude || 0)]
        }
      }))
    };
    
    res.status(200).json({
      success: true,
      data: geoJsonData
    });
  } catch (error) {
    console.error('Error fetching realtime locations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get dashboard statistics - FROM DATABASE
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_trucks,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_trucks,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_trucks,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_trucks,
        AVG(fuel_percentage)::DECIMAL(5,2) as avg_fuel,
        SUM(CASE WHEN status = 'active' THEN payload_tons ELSE 0 END) as total_payload
      FROM trucks
    `;
    
    const alertQuery = `
      SELECT COUNT(*) as active_alerts
      FROM truck_alerts 
      WHERE is_resolved = false
    `;
    
    const tireQuery = `
      SELECT COUNT(DISTINCT truck_id) as low_tire_trucks
      FROM tire_pressures 
      WHERE status = 'low'
    `;
    
    const [statsResult, alertResult, tireResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(alertQuery),
      pool.query(tireQuery)
    ]);
    
    const stats = statsResult.rows[0];
    const alerts = alertResult.rows[0];
    const tires = tireResult.rows[0];
    
    res.status(200).json({
      success: true,
      data: {
        totalTrucks: parseInt(stats.total_trucks),
        activeTrucks: parseInt(stats.active_trucks),
        inactiveTrucks: parseInt(stats.inactive_trucks),
        maintenanceTrucks: parseInt(stats.maintenance_trucks),
        averageFuel: parseFloat(stats.avg_fuel) || 0,
        totalPayload: parseFloat(stats.total_payload) || 0,
        alertsCount: parseInt(alerts.active_alerts),
        lowTirePressureCount: parseInt(tires.low_tire_trucks)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update truck status - UPDATE DATABASE
app.put('/api/trucks/:id/status', authenticateToken, async (req, res) => {
  try {
    const truckId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or maintenance'
      });
    }
    
    const updateQuery = `
      UPDATE trucks 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [status, truckId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    const updatedTruck = result.rows[0];
    
    // Broadcast update to all connected clients
    io.emit('truckStatusUpdate', {
      truckId: truckId,
      status: status,
      timestamp: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Truck status updated successfully',
      data: {
        id: updatedTruck.id,
        truckNumber: updatedTruck.truck_number,
        status: updatedTruck.status,
        lastUpdate: updatedTruck.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating truck status:', error);
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

// FIXED: Simulate real-time truck movement and updates - UPDATE DATABASE
const simulateRealTimeUpdates = () => {
  setInterval(async () => {
    try {
      // Get random active trucks to update
      const trucksQuery = `
        SELECT 
          id, 
          longitude, 
          latitude, 
          fuel_percentage, 
          speed, 
          heading
        FROM trucks 
        WHERE status = 'active' 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        ORDER BY RANDOM() 
        LIMIT $1
      `;
      
      const trucksToUpdate = Math.floor(Math.random() * 50) + 10; // Update 10-60 trucks
      const result = await pool.query(trucksQuery, [trucksToUpdate]);
      
      for (const truck of result.rows) {
        // Ensure all values are properly parsed and within bounds
        const currentLng = parseFloat(truck.longitude) || 107.15;
        const currentLat = parseFloat(truck.latitude) || -6.75;
        const currentFuel = parseFloat(truck.fuel_percentage) || 50;
        const currentSpeed = parseFloat(truck.speed) || 0;
        const currentHeading = parseInt(truck.heading) || 0;
        
        // Simulate movement (small random displacement)
        const newLng = Math.round((currentLng + (Math.random() - 0.5) * 0.001) * 100000) / 100000;
        const newLat = Math.round((currentLat + (Math.random() - 0.5) * 0.001) * 100000) / 100000;
        
        // Ensure bounds are within mining area
        const boundedLng = Math.max(107.1, Math.min(107.2, newLng));
        const boundedLat = Math.max(-6.8, Math.min(-6.7, newLat));
        
        // Generate new values with proper bounds and types
        const newSpeed = Math.round(Math.random() * 60); // 0-60 km/h as integer
        const newHeading = Math.round((currentHeading + (Math.random() - 0.5) * 30) % 360); // Keep within 0-359
        const newFuel = Math.round((Math.max(0, currentFuel - Math.random() * 0.5)) * 100) / 100; // Decimal with 2 places
        
        // Ensure heading is positive
        const finalHeading = newHeading < 0 ? newHeading + 360 : newHeading;
        
        // Update truck in database with proper data types
        await pool.query(`
          UPDATE trucks 
          SET 
            longitude = $1,
            latitude = $2,
            speed = $3, 
            heading = $4, 
            fuel_percentage = $5, 
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
        `, [
          boundedLng,           // DECIMAL longitude
          boundedLat,           // DECIMAL latitude  
          newSpeed,             // INTEGER speed
          finalHeading,         // INTEGER heading (0-359)
          newFuel,              // DECIMAL fuel percentage
          truck.id              // INTEGER truck id
        ]);
        
        // Occasionally update tire pressures (10% chance)
        if (Math.random() < 0.1) {
          const pressureChange = Math.round((Math.random() - 0.5) * 4 * 10) / 10; // -2.0 to +2.0 PSI
          
          await pool.query(`
            UPDATE tire_pressures 
            SET 
              pressure_psi = GREATEST(50, LEAST(150, pressure_psi + $1)),
              status = CASE 
                WHEN pressure_psi + $1 < 80 THEN 'low'
                WHEN pressure_psi + $1 > 120 THEN 'high'
                ELSE 'normal'
              END,
              recorded_at = CURRENT_TIMESTAMP
            WHERE truck_id = $2
          `, [pressureChange, truck.id]);
        }
      }
      
      // Broadcast updates to subscribed clients
      io.to('truckUpdates').emit('trucksLocationUpdate', {
        timestamp: new Date(),
        updatedCount: result.rows.length
      });
      
    } catch (error) {
      console.error('Error updating real-time data:', error);
      // Log detailed error for debugging
      if (error.code) {
        console.error(`Database Error Code: ${error.code}`);
        console.error(`Error Detail: ${error.detail}`);
      }
    }
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
  console.log(`💾 Using PostgreSQL database: ${process.env.DB_NAME || 'fleet_management'}`);
  
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