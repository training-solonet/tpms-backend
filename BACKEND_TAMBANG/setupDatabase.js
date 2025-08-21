const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'fleet_management', // Connect to default database first
  password: process.env.DB_PASSWORD || 'truk1234',
  port: process.env.DB_PORT || 5432,
});

const dbName = process.env.DB_NAME || 'fleet_management';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Check if database exists
const checkDatabaseExists = async () => {
  try {
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    return result.rows.length > 0;
  } catch (error) {
    log(`Error checking database: ${error.message}`, 'red');
    return false;
  }
};

// Create database if it doesn't exist
const createDatabase = async () => {
  try {
    log(`Creating database: ${dbName}`, 'yellow');
    await pool.query(`CREATE DATABASE ${dbName}`);
    log(`Database ${dbName} created successfully!`, 'green');
  } catch (error) {
    if (error.code === '42P04') {
      log(`Database ${dbName} already exists`, 'yellow');
    } else {
      log(`Error creating database: ${error.message}`, 'red');
      throw error;
    }
  }
};

// Connect to the fleet management database
const getDbPool = () => {
  return new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: dbName,
    password: process.env.DB_PASSWORD || 'truk1234',
    port: process.env.DB_PORT || 5432,
  });
};

// Execute SQL file
const executeSqlFile = async (dbPool, filePath) => {
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    await dbPool.query(sql);
    log(`Executed SQL file: ${path.basename(filePath)}`, 'green');
  } catch (error) {
    log(`Error executing SQL file ${filePath}: ${error.message}`, 'red');
    throw error;
  }
};

// Generate and insert 1000 sample trucks
const insertSampleTrucks = async (dbPool) => {
  log('Inserting 1000 sample trucks...', 'yellow');
  
  try {
    // First, get truck models
    const modelsResult = await dbPool.query('SELECT id FROM truck_models');
    const modelIds = modelsResult.rows.map(row => row.id);
    
    if (modelIds.length === 0) {
      throw new Error('No truck models found. Please ensure truck_models table is populated.');
    }
    
    const statuses = ['active', 'inactive', 'maintenance'];
    const statusWeights = [0.7, 0.2, 0.1]; // 70% active, 20% inactive, 10% maintenance
    
    // Mining area boundaries
    const bounds = {
      minLat: -6.8000,
      maxLat: -6.7000,
      minLng: 107.1000,
      maxLng: 107.2000
    };
    
    // Prepare batch insert
    const values = [];
    const placeholders = [];
    
    for (let i = 1; i <= 1000; i++) {
      // Random status based on weights
      const rand = Math.random();
      let status = 'active';
      if (rand < statusWeights[2]) status = 'maintenance';
      else if (rand < statusWeights[1] + statusWeights[2]) status = 'inactive';
      
      // Random model
      const modelId = modelIds[Math.floor(Math.random() * modelIds.length)];
      
      // Random location within mining area
      const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
      const lng = bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng);
      
      // Truck data
      const truckNumber = `T${String(i).padStart(4, '0')}`;
      const speed = status === 'active' ? Math.round(Math.random() * 60) : 0;
      const heading = Math.round(Math.random() * 360);
      const fuel = Math.round((20 + Math.random() * 80) * 10) / 10; // 20-100%
      const payload = status === 'active' ? Math.round(Math.random() * 400) : 0;
      const driver = status === 'active' ? `Driver ${i}` : null;
      const engineHours = Math.round(Math.random() * 10000);
      const odometer = Math.round(Math.random() * 100000);
      
      // Add to batch
      const valueIndex = values.length / 12; // 12 columns
      placeholders.push(`(${valueIndex * 12 + 1}, ${valueIndex * 12 + 2}, ${valueIndex * 12 + 3}, ST_SetSRID(ST_MakePoint(${valueIndex * 12 + 4}, ${valueIndex * 12 + 5}), 4326), ${valueIndex * 12 + 6}, ${valueIndex * 12 + 7}, ${valueIndex * 12 + 8}, ${valueIndex * 12 + 9}, ${valueIndex * 12 + 10}, ${valueIndex * 12 + 11}, ${valueIndex * 12 + 12}, CURRENT_DATE - INTERVAL '1 day' * FLOOR(RANDOM() * 30))`);
      
      values.push(
        truckNumber, modelId, status, lng, lat, speed, 
        heading, fuel, payload, driver, engineHours, odometer
      );
    }
    
    // Execute batch insert
    const insertQuery = `
      INSERT INTO trucks (
        truck_number, model_id, status, current_location, speed, 
        heading, fuel_percentage, payload_tons, driver_name, 
        engine_hours, odometer, last_maintenance
      ) VALUES ${placeholders.join(', ')}
    `;
    
    await dbPool.query(insertQuery, values);
    log('✓ 1000 trucks inserted successfully!', 'green');
    
  } catch (error) {
    log(`Error inserting trucks: ${error.message}`, 'red');
    throw error;
  }
};

// Insert tire pressure data for all trucks
const insertTirePressures = async (dbPool) => {
  log('Inserting tire pressure data...', 'yellow');
  
  try {
    const trucksResult = await dbPool.query('SELECT id FROM trucks');
    const truckIds = trucksResult.rows.map(row => row.id);
    
    const tirePositions = ['front_left', 'front_right', 'middle_left', 'middle_right', 'rear_left', 'rear_right'];
    
    // Process in batches of 100 trucks to avoid memory issues
    const batchSize = 100;
    const totalBatches = Math.ceil(truckIds.length / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, truckIds.length);
      const batchTruckIds = truckIds.slice(startIdx, endIdx);
      
      const values = [];
      const placeholders = [];
      
      for (const truckId of batchTruckIds) {
        for (let tireNum = 1; tireNum <= 6; tireNum++) {
          const position = tirePositions[tireNum - 1];
          const pressure = Math.round((80 + Math.random() * 40) * 10) / 10; // 80-120 PSI
          const temperature = Math.round((60 + Math.random() * 40) * 10) / 10; // 60-100°C
          
          let status = 'normal';
          if (pressure < 85) status = 'low';
          else if (pressure > 115) status = 'high';
          
          const valueIndex = values.length / 6; // 6 columns
          placeholders.push(`(${valueIndex * 6 + 1}, ${valueIndex * 6 + 2}, ${valueIndex * 6 + 3}, ${valueIndex * 6 + 4}, ${valueIndex * 6 + 5}, ${valueIndex * 6 + 6})`);
          
          values.push(truckId, position, tireNum, pressure, status, temperature);
        }
      }
      
      const insertQuery = `
        INSERT INTO tire_pressures (
          truck_id, tire_position, tire_number, pressure_psi, status, temperature
        ) VALUES ${placeholders.join(', ')}
      `;
      
      await dbPool.query(insertQuery, values);
      log(`✓ Batch ${batch + 1}/${totalBatches} tire pressures inserted`, 'cyan');
    }
    
    log('✓ All tire pressure data inserted successfully!', 'green');
    
  } catch (error) {
    log(`Error inserting tire pressures: ${error.message}`, 'red');
    throw error;
  }
};

// Insert sample alerts
const insertSampleAlerts = async (dbPool) => {
  log('Inserting sample alerts...', 'yellow');
  
  try {
    // Get random 20% of trucks for alerts
    const trucksResult = await dbPool.query('SELECT id FROM trucks ORDER BY RANDOM() LIMIT 200');
    const truckIds = trucksResult.rows.map(row => row.id);
    
    const alertTypes = [
      'Low Fuel Warning',
      'Engine Temperature High',
      'Tire Pressure Low',
      'Scheduled Maintenance Due',
      'GPS Signal Lost',
      'Overload Warning',
      'Battery Low',
      'Hydraulic Pressure Low'
    ];
    
    const severities = ['low', 'medium', 'high', 'critical'];
    
    const values = [];
    const placeholders = [];
    
    for (const truckId of truckIds) {
      // Each truck gets 1-3 alerts
      const alertCount = 1 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < alertCount; i++) {
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const message = `Alert: ${alertType} detected on truck`;
        const isResolved = Math.random() < 0.3; // 30% chance resolved
        
        const valueIndex = values.length / 5; // 5 columns
        placeholders.push(`(${valueIndex * 5 + 1}, ${valueIndex * 5 + 2}, ${valueIndex * 5 + 3}, ${valueIndex * 5 + 4}, ${valueIndex * 5 + 5})`);
        
        values.push(truckId, alertType, severity, message, isResolved);
      }
    }
    
    const insertQuery = `
      INSERT INTO truck_alerts (truck_id, alert_type, severity, message, is_resolved)
      VALUES ${placeholders.join(', ')}
    `;
    
    await dbPool.query(insertQuery, values);
    log(`✓ ${values.length / 5} alerts inserted successfully!`, 'green');
    
  } catch (error) {
    log(`Error inserting alerts: ${error.message}`, 'red');
    throw error;
  }
};

// Insert location history for active trucks
const insertLocationHistory = async (dbPool) => {
  log('Inserting location history...', 'yellow');
  
  try {
    const trucksResult = await dbPool.query(
      "SELECT id, ST_X(current_location) as lng, ST_Y(current_location) as lat FROM trucks WHERE status = 'active'"
    );
    
    const values = [];
    const placeholders = [];
    
    for (const truck of trucksResult.rows) {
      // Generate 24 hours of location history (every 30 minutes = 48 points)
      for (let hour = 0; hour < 48; hour++) {
        const timestamp = new Date();
        timestamp.setMinutes(timestamp.getMinutes() - (hour * 30));
        
        // Add some movement around current location
        const lat = parseFloat(truck.lat) + (Math.random() - 0.5) * 0.01;
        const lng = parseFloat(truck.lng) + (Math.random() - 0.5) * 0.01;
        const speed = Math.round(Math.random() * 60);
        const heading = Math.round(Math.random() * 360);
        const fuel = Math.max(20, 100 - (hour * 0.5)); // Gradual fuel decrease
        
        const valueIndex = values.length / 6; // 6 columns
        placeholders.push(`(${valueIndex * 6 + 1}, ST_SetSRID(ST_MakePoint(${valueIndex * 6 + 2}, ${valueIndex * 6 + 3}), 4326), ${valueIndex * 6 + 4}, ${valueIndex * 6 + 5}, ${valueIndex * 6 + 6}, ${valueIndex * 6 + 7})`);
        
        values.push(truck.id, lng, lat, speed, heading, fuel, timestamp.toISOString());
      }
    }
    
    // Insert in batches to avoid memory issues
    const batchSize = 1000;
    const totalBatches = Math.ceil(placeholders.length / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, placeholders.length);
      
      const batchPlaceholders = placeholders.slice(startIdx, endIdx);
      const batchValues = values.slice(startIdx * 6, endIdx * 6);
      
      const insertQuery = `
        INSERT INTO location_history (truck_id, location, speed, heading, fuel_percentage, recorded_at)
        VALUES ${batchPlaceholders.join(', ')}
      `;
      
      await dbPool.query(insertQuery, batchValues);
      log(`✓ Location history batch ${batch + 1}/${totalBatches} inserted`, 'cyan');
    }
    
    log('✓ Location history inserted successfully!', 'green');
    
  } catch (error) {
    log(`Error inserting location history: ${error.message}`, 'red');
    throw error;
  }
};

// Main setup function
const setupDatabase = async () => {
  let dbPool;
  
  try {
    log('🚀 Starting Fleet Management Database Setup...', 'blue');
    log('========================================', 'blue');
    
    // Check if database exists, create if not
    const dbExists = await checkDatabaseExists();
    if (!dbExists) {
      await createDatabase();
    }
    
    // Connect to fleet management database
    dbPool = getDbPool();
    
    // Test connection
    await dbPool.query('SELECT NOW()');
    log('✓ Database connection successful!', 'green');
    
    // Check if PostGIS extension exists
    try {
      await dbPool.query('CREATE EXTENSION IF NOT EXISTS postgis');
      await dbPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      log('✓ PostGIS extension enabled!', 'green');
    } catch (error) {
      log('Warning: Could not enable PostGIS extension. Make sure PostgreSQL has PostGIS installed.', 'yellow');
    }
    
    // Check if tables exist
    const tablesResult = await dbPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('trucks', 'truck_models')
    `);
    
    if (tablesResult.rows.length === 0) {
      log('Creating database schema...', 'yellow');
      
      // Read and execute schema file
      const schemaPath = path.join(__dirname, 'database_schema.sql');
      try {
        await executeSqlFile(dbPool, schemaPath);
        log('✓ Database schema created!', 'green');
      } catch (error) {
        if (error.code === 'ENOENT') {
          log('Schema file not found. Creating tables manually...', 'yellow');
          await createTablesManually(dbPool);
        } else {
          throw error;
        }
      }
    } else {
      log('✓ Database tables already exist!', 'green');
    }
    
    // Check if sample data exists
    const trucksCount = await dbPool.query('SELECT COUNT(*) FROM trucks');
    const currentTruckCount = parseInt(trucksCount.rows[0].count);
    
    if (currentTruckCount < 1000) {
      log(`Found ${currentTruckCount} trucks. Inserting sample data...`, 'yellow');
      
      if (currentTruckCount === 0) {
        await insertSampleTrucks(dbPool);
        await insertTirePressures(dbPool);
        await insertSampleAlerts(dbPool);
        await insertLocationHistory(dbPool);
      }
    } else {
      log(`✓ Found ${currentTruckCount} trucks in database`, 'green');
    }
    
    // Verify setup
    const stats = await dbPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM trucks) as trucks_count,
        (SELECT COUNT(*) FROM trucks WHERE status = 'active') as active_trucks,
        (SELECT COUNT(*) FROM tire_pressures) as tire_readings,
        (SELECT COUNT(*) FROM truck_alerts WHERE is_resolved = false) as active_alerts,
        (SELECT COUNT(*) FROM location_history) as location_records
    `);
    
    const summary = stats.rows[0];
    
    log('========================================', 'blue');
    log('🎉 Database Setup Complete!', 'green');
    log('========================================', 'blue');
    log(`📊 Database Summary:`, 'cyan');
    log(`   • Total Trucks: ${summary.trucks_count}`, 'cyan');
    log(`   • Active Trucks: ${summary.active_trucks}`, 'cyan');
    log(`   • Tire Readings: ${summary.tire_readings}`, 'cyan');
    log(`   • Active Alerts: ${summary.active_alerts}`, 'cyan');
    log(`   • Location Records: ${summary.location_records}`, 'cyan');
    log('========================================', 'blue');
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    if (dbPool) await dbPool.end();
    await pool.end();
  }
};

// Create tables manually if schema file is not found
const createTablesManually = async (dbPool) => {
  const createTablesSQL = `
    -- Create basic tables
    CREATE TABLE truck_models (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        manufacturer VARCHAR(50) NOT NULL,
        capacity_tons INTEGER NOT NULL,
        fuel_tank_capacity INTEGER NOT NULL,
        tire_count INTEGER DEFAULT 6,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE trucks (
        id SERIAL PRIMARY KEY,
        truck_number VARCHAR(20) UNIQUE NOT NULL,
        model_id INTEGER REFERENCES truck_models(id),
        status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
        current_location GEOMETRY(POINT, 4326),
        speed DECIMAL(5,2) DEFAULT 0,
        heading INTEGER DEFAULT 0,
        fuel_percentage DECIMAL(5,2) DEFAULT 100,
        payload_tons DECIMAL(6,2) DEFAULT 0,
        driver_name VARCHAR(100),
        engine_hours INTEGER DEFAULT 0,
        odometer INTEGER DEFAULT 0,
        last_maintenance DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE tire_pressures (
        id SERIAL PRIMARY KEY,
        truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
        tire_position VARCHAR(20) NOT NULL,
        tire_number INTEGER NOT NULL,
        pressure_psi DECIMAL(5,1) NOT NULL,
        status VARCHAR(10) CHECK (status IN ('normal', 'low', 'high')) DEFAULT 'normal',
        temperature DECIMAL(5,2),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(truck_id, tire_number)
    );

    CREATE TABLE truck_alerts (
        id SERIAL PRIMARY KEY,
        truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
        message TEXT NOT NULL,
        is_resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL
    );

    CREATE TABLE location_history (
        id SERIAL PRIMARY KEY,
        truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
        location GEOMETRY(POINT, 4326) NOT NULL,
        speed DECIMAL(5,2) DEFAULT 0,
        heading INTEGER DEFAULT 0,
        fuel_percentage DECIMAL(5,2),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert truck models
    INSERT INTO truck_models (name, manufacturer, capacity_tons, fuel_tank_capacity) VALUES
    ('797F', 'Caterpillar', 400, 4540),
    ('980E-4', 'Komatsu', 360, 4000),
    ('T284', 'Liebherr', 400, 4730),
    ('789D', 'Caterpillar', 195, 2650),
    ('830E', 'Komatsu', 220, 3030);

    -- Create indexes
    CREATE INDEX idx_trucks_location ON trucks USING GIST (current_location);
    CREATE INDEX idx_trucks_status ON trucks (status);
    CREATE INDEX idx_location_history_truck_time ON location_history (truck_id, recorded_at DESC);
  `;
  
  await dbPool.query(createTablesSQL);
  log('✓ Tables created manually!', 'green');
};

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = {
  setupDatabase,
  insertSampleTrucks,
  insertTirePressures,
  insertSampleAlerts,
  insertLocationHistory
};