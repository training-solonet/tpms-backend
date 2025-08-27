const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fleet_management',
  password: process.env.DB_PASSWORD || 'truk1234',
  port: process.env.DB_PORT || 5432,
});

const log = (message, color = 'reset') => {
  const colors = {
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
    blue: '\x1b[34m', reset: '\x1b[0m', cyan: '\x1b[36m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const quickSetup = async () => {
  let client;
  
  try {
    log('🚀 Quick Database Setup', 'blue');
    log('='.repeat(30), 'blue');
    
    client = await pool.connect();
    
    // Test connection
    await client.query('SELECT NOW()');
    log('✅ Database connection successful', 'green');
    
    // Enable extensions
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      log('✅ Extensions enabled', 'green');
    } catch (error) {
      log('⚠️ Extensions warning: ' + error.message, 'yellow');
    }
    
    // Create tables
    log('📋 Creating tables...', 'yellow');
    
    await client.query('BEGIN');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'operator',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Truck models
    await client.query(`
      CREATE TABLE IF NOT EXISTS truck_models (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        manufacturer VARCHAR(50) NOT NULL,
        capacity_tons INTEGER NOT NULL,
        fuel_tank_capacity INTEGER NOT NULL,
        tire_count INTEGER DEFAULT 6,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Trucks
    await client.query(`
      CREATE TABLE IF NOT EXISTS trucks (
        id SERIAL PRIMARY KEY,
        truck_number VARCHAR(20) UNIQUE NOT NULL,
        model_id INTEGER REFERENCES truck_models(id),
        status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
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
      )
    `);
    
    // Tire pressures
    await client.query(`
      CREATE TABLE IF NOT EXISTS tire_pressures (
        id SERIAL PRIMARY KEY,
        truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
        tire_position VARCHAR(20) NOT NULL,
        tire_number INTEGER NOT NULL,
        pressure_psi DECIMAL(5,1) NOT NULL,
        status VARCHAR(10) CHECK (status IN ('normal', 'low', 'high')) DEFAULT 'normal',
        temperature DECIMAL(5,2),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(truck_id, tire_number)
      )
    `);
    
    // Truck alerts
    await client.query(`
      CREATE TABLE IF NOT EXISTS truck_alerts (
        id SERIAL PRIMARY KEY,
        truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
        message TEXT NOT NULL,
        is_resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL
      )
    `);
    
    // Location history
    await client.query(`
      CREATE TABLE IF NOT EXISTS location_history (
        id SERIAL PRIMARY KEY,
        truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        location GEOMETRY(POINT, 4326),
        speed DECIMAL(5,2) DEFAULT 0,
        heading INTEGER DEFAULT 0,
        fuel_percentage DECIMAL(5,2),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Mining zones
    await client.query(`
      CREATE TABLE IF NOT EXISTS mining_zones (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        zone_type VARCHAR(50) NOT NULL,
        boundary GEOMETRY(POLYGON, 4326),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    log('✅ Tables created', 'green');
    
    // Insert sample data
    log('📦 Inserting sample data...', 'yellow');
    
    // Insert truck models
    const modelCheck = await client.query('SELECT COUNT(*) FROM truck_models');
    if (parseInt(modelCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO truck_models (name, manufacturer, capacity_tons, fuel_tank_capacity) VALUES
        ('797F', 'Caterpillar', 400, 4540),
        ('980E-4', 'Komatsu', 360, 4000),
        ('T284', 'Liebherr', 400, 4730),
        ('789D', 'Caterpillar', 195, 2650),
        ('830E', 'Komatsu', 220, 3030)
      `);
      log('✅ Truck models inserted', 'green');
    }
    
    // Insert default users
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO users (username, email, password_hash, role) VALUES
        ('admin', 'admin@fleet.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
        ('operator', 'operator@fleet.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operator')
      `);
      log('✅ Default users inserted (admin/admin123, operator/admin123)', 'green');
    }
    
    // Insert sample trucks
    const truckCheck = await client.query('SELECT COUNT(*) FROM trucks');
    if (parseInt(truckCheck.rows[0].count) < 10) {
      const PT_INDOBARA_BOUNDS = {
        minLat: -3.717200000114277,
        maxLat: -3.431898966201222,
        minLng: 115.432199323066001,
        maxLng: 115.658299919322602
      };
      
      const models = await client.query('SELECT id FROM truck_models');
      const modelIds = models.rows.map(r => r.id);
      
      for (let i = 1; i <= 20; i++) {
        const modelId = modelIds[Math.floor(Math.random() * modelIds.length)];
        const lat = PT_INDOBARA_BOUNDS.minLat + Math.random() * (PT_INDOBARA_BOUNDS.maxLat - PT_INDOBARA_BOUNDS.minLat);
        const lng = PT_INDOBARA_BOUNDS.minLng + Math.random() * (PT_INDOBARA_BOUNDS.maxLng - PT_INDOBARA_BOUNDS.minLng);
        
        await client.query(`
          INSERT INTO trucks (truck_number, model_id, status, latitude, longitude, speed, heading, fuel_percentage, payload_tons, driver_name, engine_hours, odometer)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          `T${String(i).padStart(4, '0')}`,
          modelId,
          'active',
          parseFloat(lat.toFixed(8)),
          parseFloat(lng.toFixed(8)),
          Math.round(Math.random() * 60),
          Math.round(Math.random() * 360),
          parseFloat((50 + Math.random() * 50).toFixed(2)),
          parseFloat((Math.random() * 400).toFixed(2)),
          `Driver ${i}`,
          Math.round(Math.random() * 10000),
          Math.round(Math.random() * 100000)
        ]);
      }
      
      log('✅ Sample trucks inserted', 'green');
    }
    
    // Create basic indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks (status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trucks_coords ON trucks (latitude, longitude)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tire_pressures_truck ON tire_pressures (truck_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_truck_alerts_truck ON truck_alerts (truck_id, is_resolved)');
    
    await client.query('COMMIT');
    
    // Final check
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM trucks) as trucks,
        (SELECT COUNT(*) FROM truck_models) as models,
        (SELECT COUNT(*) FROM users) as users
    `);
    
    const data = stats.rows[0];
    
    log('', '');
    log('🎉 SETUP COMPLETED!', 'green');
    log('='.repeat(30), 'green');
    log(`📊 Database Statistics:`, 'cyan');
    log(`   • Users: ${data.users}`, 'white');
    log(`   • Truck Models: ${data.models}`, 'white');
    log(`   • Trucks: ${data.trucks}`, 'white');
    log('', '');
    log('🔑 Default Login:', 'cyan');
    log('   Username: admin', 'white');
    log('   Password: admin123', 'white');
    log('', '');
    log('🚀 Next steps:', 'blue');
    log('   1. npm run migrate', 'cyan');
    log('   2. npm run dev', 'cyan');
    
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        // ignore
      }
    }
    
    log(`❌ Setup failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

quickSetup();