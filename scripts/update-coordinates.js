const { Pool } = require('pg');
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

// PT INDOBARA mining area boundaries from your GeoJSON
const PT_INDOBARA_BOUNDS = {
  minLat: -3.717200000114277,   // southernmost point
  maxLat: -3.431898966201222,   // northernmost point
  minLng: 115.432199323066001,  // westernmost point
  maxLng: 115.658299919322602   // easternmost point
};

// Function to generate random coordinates within PT INDOBARA boundaries
const generateRandomCoordinates = () => {
  const lat = PT_INDOBARA_BOUNDS.minLat + Math.random() * (PT_INDOBARA_BOUNDS.maxLat - PT_INDOBARA_BOUNDS.minLat);
  const lng = PT_INDOBARA_BOUNDS.minLng + Math.random() * (PT_INDOBARA_BOUNDS.maxLng - PT_INDOBARA_BOUNDS.minLng);
  
  return {
    latitude: parseFloat(lat.toFixed(8)),  // 8 decimal places for latitude
    longitude: parseFloat(lng.toFixed(8))  // 8 decimal places for longitude
  };
};

// Main function to update truck coordinates
const updateTruckCoordinates = async () => {
  let client;
  
  try {
    log('🚛 Starting truck coordinates update for PT INDOBARA area...', 'blue');
    log('=' * 60, 'blue');
    
    // Connect to database
    client = await pool.connect();
    log('✅ Connected to database', 'green');
    
    // Check current truck coordinates
    const currentTrucksQuery = `
      SELECT 
        id, 
        truck_number, 
        latitude, 
        longitude, 
        status
      FROM trucks 
      ORDER BY id
    `;
    
    const currentResult = await client.query(currentTrucksQuery);
    const trucks = currentResult.rows;
    
    log(`📊 Found ${trucks.length} trucks to update`, 'cyan');
    
    if (trucks.length === 0) {
      log('❌ No trucks found in database', 'red');
      return;
    }
    
    // Show current coordinate ranges
    const currentLats = trucks.filter(t => t.latitude).map(t => parseFloat(t.latitude));
    const currentLngs = trucks.filter(t => t.longitude).map(t => parseFloat(t.longitude));
    
    if (currentLats.length > 0 && currentLngs.length > 0) {
      log(`📍 Current coordinate ranges:`, 'yellow');
      log(`   Latitude: ${Math.min(...currentLats).toFixed(6)} to ${Math.max(...currentLats).toFixed(6)}`, 'yellow');
      log(`   Longitude: ${Math.min(...currentLngs).toFixed(6)} to ${Math.max(...currentLngs).toFixed(6)}`, 'yellow');
    }
    
    log(`🎯 New PT INDOBARA coordinate ranges:`, 'cyan');
    log(`   Latitude: ${PT_INDOBARA_BOUNDS.minLat.toFixed(6)} to ${PT_INDOBARA_BOUNDS.maxLat.toFixed(6)}`, 'cyan');
    log(`   Longitude: ${PT_INDOBARA_BOUNDS.minLng.toFixed(6)} to ${PT_INDOBARA_BOUNDS.maxLng.toFixed(6)}`, 'cyan');
    log('');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Update trucks in batches of 100
    const batchSize = 100;
    const totalBatches = Math.ceil(trucks.length / batchSize);
    let updatedCount = 0;
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, trucks.length);
      const batchTrucks = trucks.slice(startIdx, endIdx);
      
      log(`🔄 Processing batch ${batch + 1}/${totalBatches} (${batchTrucks.length} trucks)...`, 'yellow');
      
      for (const truck of batchTrucks) {
        // Generate new coordinates within PT INDOBARA boundaries
        const newCoords = generateRandomCoordinates();
        
        // Update truck coordinates with explicit type casting
        const updateQuery = `
          UPDATE trucks 
          SET 
            latitude = $1::DECIMAL(10,8),
            longitude = $2::DECIMAL(11,8),
            current_location = ST_SetSRID(ST_MakePoint($2::DECIMAL(11,8), $1::DECIMAL(10,8)), 4326),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `;
        
        await client.query(updateQuery, [
          newCoords.latitude,
          newCoords.longitude,
          truck.id
        ]);
        
        updatedCount++;
        
        // Log progress for first few trucks
        if (updatedCount <= 5 || updatedCount % 100 === 0) {
          log(`   ✅ ${truck.truck_number}: ${newCoords.latitude.toFixed(6)}, ${newCoords.longitude.toFixed(6)}`, 'green');
        }
      }
      
      log(`   ✅ Batch ${batch + 1} completed (${updatedCount}/${trucks.length})`, 'green');
    }
    
    // Also update mining zones to match PT INDOBARA area
    log('🗺️  Updating mining zones...', 'yellow');
    
    // Clear existing mining zones
    await client.query('DELETE FROM mining_zones');
    
    // Insert PT INDOBARA mining zone
    const insertZoneQuery = `
      INSERT INTO mining_zones (name, zone_type, boundary, is_active) VALUES 
      ($1, $2, ST_GeomFromText($3, 4326), true)
    `;
    
    // Create a polygon from your GeoJSON coordinates (simplified main area)
    const mainPolygonWKT = `POLYGON((${[
      [115.604399949931505, -3.545400075547209],
      [115.658299919322602, -3.473005894715275],
      [115.613499543131596, -3.54540116002996],
      [115.604399949931505, -3.545400075547209]
    ].map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
    
    await client.query(insertZoneQuery, [
      'PT INDOBARA Main Area',
      'extraction', 
      mainPolygonWKT
    ]);
    
    // Add processing area
    const processingPolygonWKT = `POLYGON((${[
      [115.55, -3.65],
      [115.60, -3.65],
      [115.60, -3.60],
      [115.55, -3.60],
      [115.55, -3.65]
    ].map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
    
    await client.query(insertZoneQuery, [
      'PT INDOBARA Processing Area',
      'processing',
      processingPolygonWKT
    ]);
    
    // Add maintenance area
    const maintenancePolygonWKT = `POLYGON((${[
      [115.62, -3.52],
      [115.65, -3.52],
      [115.65, -3.50],
      [115.62, -3.50],
      [115.62, -3.52]
    ].map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
    
    await client.query(insertZoneQuery, [
      'PT INDOBARA Maintenance Area',
      'maintenance',
      maintenancePolygonWKT
    ]);
    
    log('✅ Mining zones updated', 'green');
    
    // Update location history for active trucks (optional)
    log('📈 Updating recent location history...', 'yellow');
    
    const activeTrucks = trucks.filter(t => t.status === 'active').slice(0, 50); // Limit to 50 trucks
    
    for (const truck of activeTrucks) {
      // Generate 10 recent location points around the truck's new position
      const truckCoords = generateRandomCoordinates();
      
      for (let i = 0; i < 10; i++) {
        const historyCoords = {
          latitude: parseFloat((truckCoords.latitude + (Math.random() - 0.5) * 0.01).toFixed(8)),
          longitude: parseFloat((truckCoords.longitude + (Math.random() - 0.5) * 0.01).toFixed(8))
        };
        
        const timestamp = new Date();
        timestamp.setMinutes(timestamp.getMinutes() - (i * 30)); // Every 30 minutes
        
        await client.query(`
          INSERT INTO location_history (truck_id, location, latitude, longitude, speed, heading, fuel_percentage, recorded_at)
          VALUES ($1, ST_SetSRID(ST_MakePoint($2::DECIMAL(11,8), $3::DECIMAL(10,8)), 4326), $3::DECIMAL(10,8), $2::DECIMAL(11,8), $4, $5, $6::DECIMAL(5,2), $7)
        `, [
          truck.id,
          historyCoords.longitude,
          historyCoords.latitude,
          Math.round(Math.random() * 60), // speed
          Math.round(Math.random() * 360), // heading
          parseFloat((50 + Math.random() * 50).toFixed(2)), // fuel 50-100%
          timestamp
        ]);
      }
    }
    
    log(`✅ Updated location history for ${activeTrucks.length} active trucks`, 'green');
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Verify the update
    const verificationQuery = `
      SELECT 
        COUNT(*) as total_trucks,
        MIN(latitude) as min_lat,
        MAX(latitude) as max_lat,
        MIN(longitude) as min_lng,
        MAX(longitude) as max_lng,
        COUNT(CASE WHEN latitude BETWEEN $1 AND $2 AND longitude BETWEEN $3 AND $4 THEN 1 END) as trucks_in_bounds
      FROM trucks 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `;
    
    const verifyResult = await client.query(verificationQuery, [
      PT_INDOBARA_BOUNDS.minLat,
      PT_INDOBARA_BOUNDS.maxLat,
      PT_INDOBARA_BOUNDS.minLng,
      PT_INDOBARA_BOUNDS.maxLng
    ]);
    
    const stats = verifyResult.rows[0];
    
    log('');
    log('=' * 60, 'blue');
    log('🎉 UPDATE COMPLETE!', 'green');
    log('=' * 60, 'blue');
    log(`📊 Update Summary:`, 'cyan');
    log(`   • Total trucks updated: ${updatedCount}`, 'cyan');
    log(`   • Trucks in PT INDOBARA bounds: ${stats.trucks_in_bounds}/${stats.total_trucks}`, 'cyan');
    log(`   • New latitude range: ${parseFloat(stats.min_lat).toFixed(6)} to ${parseFloat(stats.max_lat).toFixed(6)}`, 'cyan');
    log(`   • New longitude range: ${parseFloat(stats.min_lng).toFixed(6)} to ${parseFloat(stats.max_lng).toFixed(6)}`, 'cyan');
    log(`   • Mining zones updated: 3 zones`, 'cyan');
    log(`   • Location history updated: ${activeTrucks.length} trucks`, 'cyan');
    log('');
    log('✅ All truck coordinates now match PT INDOBARA mining area!', 'green');
    log('🚀 You can now restart your server to see the updated coordinates.', 'blue');
    
  } catch (error) {
    log(`❌ Error updating coordinates: ${error.message}`, 'red');
    console.error(error);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
        log('🔄 Transaction rolled back', 'yellow');
      } catch (rollbackError) {
        log(`❌ Rollback error: ${rollbackError.message}`, 'red');
      }
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
};

// Also update the locationService.js bounds
const updateLocationServiceBounds = async () => {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const locationServicePath = path.join(__dirname, 'src/services/locationService.js');
    let content = await fs.readFile(locationServicePath, 'utf8');
    
    // Replace the old bounds with PT INDOBARA bounds
    const oldBounds = /const boundedLng = Math\.max\([^;]+;[\s]*const boundedLat = Math\.max\([^;]+;/g;
    const newBounds = `const boundedLng = Math.max(${PT_INDOBARA_BOUNDS.minLng}, Math.min(${PT_INDOBARA_BOUNDS.maxLng}, newLng));
        const boundedLat = Math.max(${PT_INDOBARA_BOUNDS.minLat}, Math.min(${PT_INDOBARA_BOUNDS.maxLat}, newLat));`;
    
    content = content.replace(oldBounds, newBounds);
    
    // Also update the initial coordinates for new simulation
    const oldInitCoords = /const currentLng = parseFloat\(truck\.longitude\) \|\| [^;]+;[\s]*const currentLat = parseFloat\(truck\.latitude\) \|\| [^;]+;/g;
    const newInitCoords = `const currentLng = parseFloat(truck.longitude) || ${(PT_INDOBARA_BOUNDS.minLng + PT_INDOBARA_BOUNDS.maxLng) / 2};
        const currentLat = parseFloat(truck.latitude) || ${(PT_INDOBARA_BOUNDS.minLat + PT_INDOBARA_BOUNDS.maxLat) / 2};`;
    
    content = content.replace(oldInitCoords, newInitCoords);
    
    await fs.writeFile(locationServicePath, content, 'utf8');
    log('✅ LocationService bounds updated for PT INDOBARA area', 'green');
    
  } catch (error) {
    log(`⚠️  Could not update locationService.js: ${error.message}`, 'yellow');
    log('   Please manually update the bounds in src/services/locationService.js', 'yellow');
  }
};

// Run the update
if (require.main === module) {
  updateTruckCoordinates()
    .then(() => updateLocationServiceBounds())
    .then(() => {
      log('');
      log('🎯 Next steps:', 'blue');
      log('   1. Restart your server: npm run dev', 'cyan');
      log('   2. Test the API: node script/test-api.js', 'cyan');
      log('   3. Check coordinates in your frontend', 'cyan');
    });
}

module.exports = {
  updateTruckCoordinates,
  PT_INDOBARA_BOUNDS
};