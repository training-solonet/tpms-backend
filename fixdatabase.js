const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fleet_management',
  password: process.env.DB_PASSWORD || 'truk1234',
  port: process.env.DB_PORT || 5432,
});

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

// Fix database schema
const fixDatabaseSchema = async () => {
  try {
    log('🔧 Starting database schema fix...', 'blue');
    log('========================================', 'blue');
    
    // Test connection
    const client = await pool.connect();
    log('✅ Database connected successfully!', 'green');
    
    // Check current table structure
    log('📋 Checking current table structure...', 'yellow');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' 
      ORDER BY ordinal_position
    `);
    
    log('Current trucks table columns:', 'cyan');
    tableInfo.rows.forEach(row => {
      log(`   • ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`, 'cyan');
    });
    
    // Check if latitude/longitude columns exist
    const hasLatitude = tableInfo.rows.some(row => row.column_name === 'latitude');
    const hasLongitude = tableInfo.rows.some(row => row.column_name === 'longitude');
    const hasCurrentLocation = tableInfo.rows.some(row => row.column_name === 'current_location');
    
    log(`\n📍 Column status:`, 'cyan');
    log(`   • latitude: ${hasLatitude ? '✅ EXISTS' : '❌ MISSING'}`, hasLatitude ? 'green' : 'red');
    log(`   • longitude: ${hasLongitude ? '✅ EXISTS' : '❌ MISSING'}`, hasLongitude ? 'green' : 'red');
    log(`   • current_location: ${hasCurrentLocation ? '✅ EXISTS' : '❌ MISSING'}`, hasCurrentLocation ? 'green' : 'yellow');
    
    // Add missing columns
    if (!hasLatitude) {
      log('\n➕ Adding latitude column...', 'yellow');
      await client.query('ALTER TABLE trucks ADD COLUMN latitude DECIMAL(10, 8)');
      log('✅ Latitude column added!', 'green');
    }
    
    if (!hasLongitude) {
      log('➕ Adding longitude column...', 'yellow');
      await client.query('ALTER TABLE trucks ADD COLUMN longitude DECIMAL(11, 8)');
      log('✅ Longitude column added!', 'green');
    }
    
    // Populate coordinates if they don't exist
    log('\n🌍 Populating coordinates...', 'yellow');
    
    if (hasCurrentLocation) {
      // Try to extract from PostGIS geometry first
      log('📍 Extracting coordinates from PostGIS geometry...', 'cyan');
      try {
        const updateResult = await client.query(`
          UPDATE trucks 
          SET 
            latitude = ST_Y(current_location),
            longitude = ST_X(current_location)
          WHERE current_location IS NOT NULL 
          AND (latitude IS NULL OR longitude IS NULL)
        `);
        log(`✅ Updated ${updateResult.rowCount} trucks from PostGIS geometry`, 'green');
      } catch (error) {
        log('⚠️ PostGIS extraction failed, using random coordinates', 'yellow');
      }
    }
    
    // Fill remaining trucks with random mining area coordinates
    const randomUpdateResult = await client.query(`
      UPDATE trucks 
      SET 
        latitude = -6.8000 + RANDOM() * 0.1000,
        longitude = 107.1000 + RANDOM() * 0.1000
      WHERE (latitude IS NULL OR longitude IS NULL)
    `);
    
    if (randomUpdateResult.rowCount > 0) {
      log(`✅ Generated random coordinates for ${randomUpdateResult.rowCount} trucks`, 'green');
    }
    
    // Create indexes
    log('\n📚 Creating performance indexes...', 'yellow');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trucks_latitude ON trucks (latitude)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trucks_longitude ON trucks (longitude)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trucks_coordinates ON trucks (latitude, longitude)');
    log('✅ Indexes created!', 'green');
    
    // Update timestamps
    await client.query('UPDATE trucks SET updated_at = CURRENT_TIMESTAMP WHERE latitude IS NOT NULL');
    
    // Verify results
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total_trucks,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as trucks_with_coords,
        MIN(latitude) as min_lat,
        MAX(latitude) as max_lat,
        MIN(longitude) as min_lng,
        MAX(longitude) as max_lng
      FROM trucks
    `);
    
    const stats = verifyResult.rows[0];
    
    log('\n========================================', 'blue');
    log('🎉 Database schema fix completed!', 'green');
    log('========================================', 'blue');
    log(`📊 Results:`, 'cyan');
    log(`   • Total trucks: ${stats.total_trucks}`, 'cyan');
    log(`   • Trucks with coordinates: ${stats.trucks_with_coords}`, 'cyan');
    log(`   • Latitude range: ${parseFloat(stats.min_lat).toFixed(6)} to ${parseFloat(stats.max_lat).toFixed(6)}`, 'cyan');
    log(`   • Longitude range: ${parseFloat(stats.min_lng).toFixed(6)} to ${parseFloat(stats.max_lng).toFixed(6)}`, 'cyan');
    log('========================================', 'blue');
    
    client.release();
    
  } catch (error) {
    log(`❌ Schema fix failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run if this script is executed directly
if (require.main === module) {
  fixDatabaseSchema();
}

module.exports = { fixDatabaseSchema };