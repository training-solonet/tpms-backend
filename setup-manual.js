const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'fleet_management', // Connect to default database first
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

const dbName = process.env.DB_NAME || 'fleet_management';

const setupManual = async () => {
  try {
    console.log('🚀 Manual Database Setup...');
    
    // 1. Create database
    try {
      await pool.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Database created!');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('✅ Database already exists');
      } else {
        throw error;
      }
    }
    
    // 2. Connect to fleet_management database
    const dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });
    
    // 3. Create tables without PostGIS (use simple coordinates)
    console.log('📝 Creating tables...');
    
    await dbPool.query(`
      -- Truck models table
      CREATE TABLE IF NOT EXISTS truck_models (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          manufacturer VARCHAR(50) NOT NULL,
          capacity_tons INTEGER NOT NULL,
          fuel_tank_capacity INTEGER NOT NULL,
          tire_count INTEGER DEFAULT 6,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await dbPool.query(`
      -- Trucks table (using simple lat/lng instead of PostGIS)
      CREATE TABLE IF NOT EXISTS trucks (
          id SERIAL PRIMARY KEY,
          truck_number VARCHAR(20) UNIQUE NOT NULL,
          model_id INTEGER REFERENCES truck_models(id),
          status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
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
    `);
    
    await dbPool.query(`
      -- Tire pressures table
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
      );
    `);
    
    await dbPool.query(`
      -- Truck alerts table
      CREATE TABLE IF NOT EXISTS truck_alerts (
          id SERIAL PRIMARY KEY,
          truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
          alert_type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
          message TEXT NOT NULL,
          is_resolved BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP NULL
      );
    `);
    
    await dbPool.query(`
      -- Location history table
      CREATE TABLE IF NOT EXISTS location_history (
          id SERIAL PRIMARY KEY,
          truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          speed DECIMAL(5,2) DEFAULT 0,
          heading INTEGER DEFAULT 0,
          fuel_percentage DECIMAL(5,2),
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 4. Insert truck models
    console.log('🚛 Inserting truck models...');
    await dbPool.query(`
      INSERT INTO truck_models (name, manufacturer, capacity_tons, fuel_tank_capacity) 
      VALUES 
        ('797F', 'Caterpillar', 400, 4540),
        ('980E-4', 'Komatsu', 360, 4000),
        ('T284', 'Liebherr', 400, 4730),
        ('789D', 'Caterpillar', 195, 2650),
        ('830E', 'Komatsu', 220, 3030)
      ON CONFLICT DO NOTHING;
    `);
    
    // 5. Create indexes
    console.log('📊 Creating indexes...');
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks (status);
      CREATE INDEX IF NOT EXISTS idx_trucks_location ON trucks (latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_location_history_truck_time ON location_history (truck_id, recorded_at DESC);
    `);
    
    console.log('✅ Manual database setup complete!');
    
    await dbPool.end();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
};

setupManual();