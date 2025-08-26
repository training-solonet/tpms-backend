const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fleet_management',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// FIXED: Use only models that exist in database
const existingTruckModels = [
  { name: '797F', manufacturer: 'Caterpillar', capacity: 400, fuelTank: 4540 },
  { name: '980E-4', manufacturer: 'Komatsu', capacity: 360, fuelTank: 4000 },
  { name: 'T284', manufacturer: 'Liebherr', capacity: 400, fuelTank: 4730 },
  { name: '789D', manufacturer: 'Caterpillar', capacity: 195, fuelTank: 2650 },
  { name: '830E', manufacturer: 'Komatsu', capacity: 220, fuelTank: 3030 }
];

const driverNames = [
  'Ahmad Susanto', 'Budi Hartono', 'Chandra Wijaya', 'Dedi Kurniawan', 'Eko Prasetyo',
  'Fajar Nugroho', 'Gunawan Saputra', 'Hendri Setiawan', 'Indra Permana', 'Joko Widodo',
  'Kurnia Rahman', 'Lucky Hakim', 'Muhammad Rizki', 'Nanda Pratama', 'Oscar Simanjuntak',
  'Putra Mahendra', 'Qomar Hidayat', 'Rendi Sanjaya', 'Sandi Wibowo', 'Taufik Ismail',
  'Udin Sedunia', 'Vicky Ramadhan', 'Wahyu Santoso', 'Xavier Tobing', 'Yudi Pranata',
  'Zainal Abidin', 'Agus Salim', 'Bambang Sutrisno', 'Catur Pamungkas', 'Dwi Cahyono'
];

const alertTypes = [
  'Low Fuel Warning', 'Engine Temperature High', 'Tire Pressure Low', 'Hydraulic Pressure Drop',
  'Battery Voltage Low', 'GPS Signal Weak', 'Scheduled Maintenance Due', 'Overload Warning',
  'Engine Oil Pressure Low', 'Brake System Warning', 'Transmission Temperature High',
  'Air Filter Clogged', 'Coolant Level Low', 'Electrical System Fault', 'Suspension Warning'
];

// Mining area boundaries (realistic Indonesia mining coordinates)
const miningAreas = {
  mainPit: {
    name: 'Main Extraction Pit',
    bounds: { minLat: -6.8000, maxLat: -6.7500, minLng: 107.1000, maxLng: 107.1500 }
  },
  processingArea: {
    name: 'Processing Plant Area', 
    bounds: { minLat: -6.7600, maxLat: -6.7400, minLng: 107.1200, maxLng: 107.1400 }
  },
  wasteDump: {
    name: 'Waste Dump Zone',
    bounds: { minLat: -6.7800, maxLat: -6.7600, minLng: 107.0800, maxLng: 107.1000 }
  },
  loadingArea: {
    name: 'Loading/Unloading Zone',
    bounds: { minLat: -6.7700, maxLat: -6.7600, minLng: 107.1600, maxLng: 107.1800 }
  }
};

// Generate realistic truck data
const generateTruckData = () => {
  const trucks = [];
  const statuses = ['active', 'inactive', 'maintenance'];
  const statusWeights = [0.70, 0.20, 0.10]; // 70% active, 20% inactive, 10% maintenance
  
  for (let i = 1; i <= 1000; i++) {
    // Determine status based on weights
    const rand = Math.random();
    let status = 'active';
    if (rand < statusWeights[2]) {
      status = 'maintenance';
    } else if (rand < statusWeights[1] + statusWeights[2]) {
      status = 'inactive';  
    }
    
    // Random model - ONLY use existing models
    const model = existingTruckModels[Math.floor(Math.random() * existingTruckModels.length)];
    
    // Random location within mining areas
    const areas = Object.values(miningAreas);
    const area = areas[Math.floor(Math.random() * areas.length)];
    const lat = area.bounds.minLat + Math.random() * (area.bounds.maxLat - area.bounds.minLat);
    const lng = area.bounds.minLng + Math.random() * (area.bounds.maxLng - area.bounds.minLng);
    
    // Generate realistic operational data
    const baseSpeed = status === 'active' ? 15 + Math.random() * 45 : 0; // 15-60 km/h for active
    const speed = Math.round(baseSpeed * 10) / 10;
    const heading = Math.round(Math.random() * 360);
    const fuel = Math.round((status === 'active' ? 25 + Math.random() * 70 : 10 + Math.random() * 40) * 10) / 10;
    const payload = status === 'active' ? Math.round((Math.random() * model.capacity) * 10) / 10 : 0;
    const driver = status === 'active' ? driverNames[Math.floor(Math.random() * driverNames.length)] : null;
    const engineHours = Math.round(500 + Math.random() * 9500); // 500-10000 hours
    const odometer = Math.round(5000 + Math.random() * 95000); // 5000-100000 km
    
    // Generate tire pressure data (6 tires per truck)
    const tirePressures = [];
    const tirePositions = ['front_left', 'front_right', 'middle_left', 'middle_right', 'rear_left', 'rear_right'];
    
    for (let j = 0; j < 6; j++) {
      const basePressure = 90 + Math.random() * 20; // 90-110 PSI base
      const variation = (Math.random() - 0.5) * 15; // ±7.5 PSI variation
      const pressure = Math.round((basePressure + variation) * 10) / 10;
      const temperature = Math.round((65 + Math.random() * 30) * 10) / 10; // 65-95°C
      
      let tireStatus = 'normal';
      if (pressure < 80) tireStatus = 'low';
      else if (pressure > 115) tireStatus = 'high';
      
      tirePressures.push({
        position: tirePositions[j],
        tireNumber: j + 1,
        pressure: pressure,
        status: tireStatus,
        temperature: temperature
      });
    }
    
    // Generate alerts for some trucks
    const alerts = [];
    if (Math.random() < 0.25) { // 25% chance of having alerts
      const alertCount = 1 + Math.floor(Math.random() * 3); // 1-3 alerts
      const usedAlerts = new Set();
      
      for (let k = 0; k < alertCount; k++) {
        let alertType;
        do {
          alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        } while (usedAlerts.has(alertType));
        
        usedAlerts.add(alertType);
        
        const severities = ['low', 'medium', 'high', 'critical'];
        const severityWeights = [0.4, 0.3, 0.2, 0.1]; // Most alerts are low/medium
        
        let severity = 'low';
        const severityRand = Math.random();
        if (severityRand < severityWeights[3]) severity = 'critical';
        else if (severityRand < severityWeights[2] + severityWeights[3]) severity = 'high';
        else if (severityRand < severityWeights[1] + severityWeights[2] + severityWeights[3]) severity = 'medium';
        
        alerts.push({
          type: alertType,
          severity: severity,
          message: `${alertType} detected on truck ${String(i).padStart(4, '0')}`,
          isResolved: Math.random() < 0.3, // 30% chance resolved
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 7) // Within last 7 days
        });
      }
    }
    
    // Create truck object
    const truck = {
      id: i,
      truckNumber: `T${String(i).padStart(4, '0')}`,
      model: model,
      status: status,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      speed: speed,
      heading: heading,
      fuel: fuel,
      payload: payload,
      driver: driver,
      engineHours: engineHours,
      odometer: odometer,
      lastMaintenance: new Date(Date.now() - Math.random() * 86400000 * 60), // Last 60 days
      tirePressures: tirePressures,
      alerts: alerts,
      lastUpdate: new Date(Date.now() - Math.random() * 300000), // Last 5 minutes
      currentZone: area.name
    };
    
    trucks.push(truck);
  }
  
  return trucks;
};

// Insert truck models if not exist
const ensureTruckModels = async () => {
  log('Checking truck models...', 'yellow');
  
  try {
    const existingModels = await pool.query('SELECT COUNT(*) FROM truck_models');
    const count = parseInt(existingModels.rows[0].count);
    
    log(`✓ Found ${count} existing truck models`, 'green');
    
    if (count < 5) {
      log('Inserting missing truck models...', 'yellow');
      
      for (const model of existingTruckModels) {
        await pool.query(`
          INSERT INTO truck_models (name, manufacturer, capacity_tons, fuel_tank_capacity, tire_count)
          VALUES ($1, $2, $3, $4, 6)
          ON CONFLICT DO NOTHING
        `, [model.name, model.manufacturer, model.capacity, model.fuelTank]);
      }
      
      log(`✓ ${existingTruckModels.length} truck models ensured!`, 'green');
    }
  } catch (error) {
    log(`Error with truck models: ${error.message}`, 'red');
    throw error;
  }
};

// Clear existing data
const clearExistingData = async () => {
  log('Clearing existing truck data...', 'yellow');
  
  try {
    await pool.query('DELETE FROM location_history');
    log('✓ Cleared location_history', 'green');
    
    await pool.query('DELETE FROM truck_alerts');
    log('✓ Cleared truck_alerts', 'green');
    
    await pool.query('DELETE FROM tire_pressures');
    log('✓ Cleared tire_pressures', 'green');
    
    await pool.query('DELETE FROM trucks');
    log('✓ Cleared trucks', 'green');
    
    log('✓ Existing data cleared!', 'green');
  } catch (error) {
    log(`Error clearing data: ${error.message}`, 'red');
    throw error;
  }
};

// FIXED: Insert trucks in batches with proper parameter handling
const insertTrucks = async (trucks) => {
  log('Inserting 1000 trucks...', 'yellow');
  
  try {
    // Get truck model IDs from database
    const modelsResult = await pool.query('SELECT id, name, manufacturer FROM truck_models');
    const modelMap = {};
    modelsResult.rows.forEach(row => {
      const key = `${row.manufacturer}-${row.name}`;
      modelMap[key] = row.id;
      log(`  Model: ${key} = ID ${row.id}`, 'cyan');
    });
    
    const batchSize = 25; // SMALLER batch size to avoid parameter issues
    const totalBatches = Math.ceil(trucks.length / batchSize);
    
    log('Using separate latitude/longitude columns', 'cyan');
    
    let successfulInserts = 0;
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, trucks.length);
      const batchTrucks = trucks.slice(startIdx, endIdx);
      
      // Filter out trucks with unknown models
      const validTrucks = batchTrucks.filter(truck => {
        const modelKey = `${truck.model.manufacturer}-${truck.model.name}`;
        const hasModel = modelMap[modelKey];
        if (!hasModel) {
          log(`Skipping truck ${truck.truckNumber} - model ${modelKey} not found`, 'yellow');
        }
        return hasModel;
      });
      
      if (validTrucks.length === 0) {
        log(`Batch ${batch + 1}/${totalBatches} - no valid trucks to insert`, 'yellow');
        continue;
      }
      
      // Build query with proper parameters
      const values = [];
      const placeholders = [];
      
      validTrucks.forEach((truck, index) => {
        const modelKey = `${truck.model.manufacturer}-${truck.model.name}`;
        const modelId = modelMap[modelKey];
        
        const paramOffset = index * 13; // 13 fields per truck
        placeholders.push(`(
          $${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, 
          $${paramOffset + 4}, $${paramOffset + 5}, $${paramOffset + 6}, 
          $${paramOffset + 7}, $${paramOffset + 8}, $${paramOffset + 9}, 
          $${paramOffset + 10}, $${paramOffset + 11}, $${paramOffset + 12}, $${paramOffset + 13}
        )`);
        
        values.push(
          truck.truckNumber,           // $1
          modelId,                     // $2
          truck.status,                // $3
          truck.location.coordinates[1], // latitude $4
          truck.location.coordinates[0], // longitude $5
          truck.speed,                 // $6
          truck.heading,               // $7
          truck.fuel,                  // $8
          truck.payload,               // $9
          truck.driver,                // $10
          truck.engineHours,           // $11
          truck.odometer,              // $12
          truck.lastMaintenance        // $13
        );
      });
      
      if (values.length === 0) {
        continue;
      }
      
      const insertQuery = `
        INSERT INTO trucks (
          truck_number, model_id, status, latitude, longitude, speed, 
          heading, fuel_percentage, payload_tons, driver_name, 
          engine_hours, odometer, last_maintenance
        ) VALUES ${placeholders.join(', ')}
        RETURNING id, truck_number
      `;
      
      try {
        const result = await pool.query(insertQuery, values);
        
        // Store truck IDs for later use
        result.rows.forEach((row, index) => {
          if (validTrucks[index]) {
            validTrucks[index].dbId = row.id;
          }
        });
        
        successfulInserts += result.rows.length;
        log(`✓ Batch ${batch + 1}/${totalBatches} inserted (${result.rows.length} trucks)`, 'cyan');
        
      } catch (error) {
        log(`Error in batch ${batch + 1}: ${error.message}`, 'red');
        log(`Parameters count: ${values.length}, Expected: ${validTrucks.length * 13}`, 'red');
      }
    }
    
    log(`✅ ${successfulInserts} trucks inserted successfully!`, 'green');
    return trucks;
    
  } catch (error) {
    log(`Error inserting trucks: ${error.message}`, 'red');
    throw error;
  }
};

// Insert tire pressures
const insertTirePressures = async (trucks) => {
  log('Inserting tire pressure data...', 'yellow');
  
  try {
    const trucksWithIds = trucks.filter(truck => truck.dbId);
    
    if (trucksWithIds.length === 0) {
      log('No trucks with IDs found, skipping tire pressures', 'yellow');
      return;
    }
    
    const batchSize = 50; // 50 trucks at a time
    const totalBatches = Math.ceil(trucksWithIds.length / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, trucksWithIds.length);
      const batchTrucks = trucksWithIds.slice(startIdx, endIdx);
      
      const values = [];
      const placeholders = [];
      
      batchTrucks.forEach(truck => {
        truck.tirePressures.forEach((tire, tireIndex) => {
          const paramOffset = values.length;
          placeholders.push(`(
            $${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, 
            $${paramOffset + 4}, $${paramOffset + 5}, $${paramOffset + 6}
          )`);
          
          values.push(
            truck.dbId,
            tire.position,
            tire.tireNumber,
            tire.pressure,
            tire.status,
            tire.temperature
          );
        });
      });
      
      if (values.length === 0) {
        continue;
      }
      
      const insertQuery = `
        INSERT INTO tire_pressures (
          truck_id, tire_position, tire_number, pressure_psi, status, temperature
        ) VALUES ${placeholders.join(', ')}
      `;
      
      await pool.query(insertQuery, values);
      
      log(`✓ Batch ${batch + 1}/${totalBatches} tire pressures inserted`, 'cyan');
    }
    
    log('✅ All tire pressure data inserted!', 'green');
    
  } catch (error) {
    log(`Error inserting tire pressures: ${error.message}`, 'red');
    throw error;
  }
};

// Insert alerts
const insertAlerts = async (trucks) => {
  log('Inserting truck alerts...', 'yellow');
  
  try {
    const trucksWithAlerts = trucks.filter(truck => truck.alerts.length > 0 && truck.dbId);
    
    if (trucksWithAlerts.length === 0) {
      log('No trucks with alerts found', 'yellow');
      return;
    }
    
    const values = [];
    const placeholders = [];
    
    trucksWithAlerts.forEach(truck => {
      truck.alerts.forEach(alert => {
        const paramOffset = values.length;
        placeholders.push(`(
          $${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, 
          $${paramOffset + 4}, $${paramOffset + 5}, $${paramOffset + 6}
        )`);
        
        values.push(
          truck.dbId,
          alert.type,
          alert.severity,
          alert.message,
          alert.isResolved,
          alert.createdAt
        );
      });
    });
    
    const insertQuery = `
      INSERT INTO truck_alerts (
        truck_id, alert_type, severity, message, is_resolved, created_at
      ) VALUES ${placeholders.join(', ')}
    `;
    
    await pool.query(insertQuery, values);
    
    log(`✅ ${values.length / 6} alerts inserted for ${trucksWithAlerts.length} trucks!`, 'green');
    
  } catch (error) {
    log(`Error inserting alerts: ${error.message}`, 'red');
    throw error;
  }
};

// Insert location history for active trucks
const insertLocationHistory = async (trucks) => {
  log('Inserting location history...', 'yellow');
  
  try {
    const activeTrucks = trucks.filter(truck => truck.status === 'active' && truck.dbId);
    log(`Generating history for ${activeTrucks.length} active trucks...`, 'cyan');
    
    if (activeTrucks.length === 0) {
      log('No active trucks found', 'yellow');
      return;
    }
    
    // Process in smaller batches
    const truckBatchSize = 10; // Process 10 trucks at a time
    const totalTruckBatches = Math.ceil(activeTrucks.length / truckBatchSize);
    
    for (let truckBatch = 0; truckBatch < totalTruckBatches; truckBatch++) {
      const startIdx = truckBatch * truckBatchSize;
      const endIdx = Math.min(startIdx + truckBatchSize, activeTrucks.length);
      const batchTrucks = activeTrucks.slice(startIdx, endIdx);
      
      const values = [];
      const placeholders = [];
      
      batchTrucks.forEach(truck => {
        // Generate 24 hours of history (every 2 hours = 12 points to reduce data)
        for (let hour = 0; hour < 12; hour++) {
          const timestamp = new Date();
          timestamp.setHours(timestamp.getHours() - (hour * 2));
          
          // Create movement pattern around current location
          const currentLng = truck.location.coordinates[0];
          const currentLat = truck.location.coordinates[1];
          
          // Realistic movement (within 0.01 degrees ~1km radius)
          const movementRadius = 0.01;
          const angle = Math.random() * 2 * Math.PI;
          const distance = Math.random() * movementRadius;
          
          const lng = currentLng + (distance * Math.cos(angle));
          const lat = currentLat + (distance * Math.sin(angle));
          
          const speed = Math.round((10 + Math.random() * 50) * 10) / 10;
          const heading = Math.round(Math.random() * 360);
          const fuel = Math.max(10, truck.fuel + (Math.random() - 0.7) * 2);
          
          const paramOffset = values.length;
          placeholders.push(`(
            $${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, 
            $${paramOffset + 4}, $${paramOffset + 5}, $${paramOffset + 6}, $${paramOffset + 7}
          )`);
          
          values.push(truck.dbId, lat, lng, speed, heading, fuel, timestamp);
        }
      });
      
      if (values.length === 0) {
        continue;
      }
      
      const insertQuery = `
        INSERT INTO location_history (truck_id, latitude, longitude, speed, heading, fuel_percentage, recorded_at)
        VALUES ${placeholders.join(', ')}
      `;
      
      await pool.query(insertQuery, values);
      
      log(`✓ Location history batch ${truckBatch + 1}/${totalTruckBatches} inserted`, 'cyan');
    }
    
    log(`✅ Location history inserted for ${activeTrucks.length} active trucks!`, 'green');
    
  } catch (error) {
    log(`Error inserting location history: ${error.message}`, 'red');
    throw error;
  }
};

// Main function
const generateAndInsertDummyData = async (saveJson = false) => {
  try {
    log('🚛 FLEET MANAGEMENT - 1000 DUMMY TRUCKS GENERATOR', 'blue');
    log('='.repeat(60), 'blue');
    
    // Test database connection
    await pool.query('SELECT NOW()');
    log('✅ Database connection successful!', 'green');
    
    // Generate 1000 trucks data
    log('🎲 Generating 1000 realistic truck data...', 'magenta');
    const trucks = generateTruckData();
    log(`✅ Generated ${trucks.length} trucks with realistic data!`, 'green');
    
    // Ensure truck models exist
    await ensureTruckModels();
    
    // Clear existing data
    await clearExistingData();
    
    // Insert all data
    const trucksWithIds = await insertTrucks(trucks);
    await insertTirePressures(trucksWithIds);
    await insertAlerts(trucksWithIds);
    await insertLocationHistory(trucksWithIds);
    
    // Final verification and summary
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM trucks) as total_trucks,
        (SELECT COUNT(*) FROM trucks WHERE status = 'active') as active_trucks,
        (SELECT COUNT(*) FROM trucks WHERE status = 'inactive') as inactive_trucks,
        (SELECT COUNT(*) FROM trucks WHERE status = 'maintenance') as maintenance_trucks,
        (SELECT COUNT(*) FROM tire_pressures) as tire_readings,
        (SELECT COUNT(*) FROM truck_alerts WHERE is_resolved = false) as active_alerts,
        (SELECT COUNT(*) FROM location_history) as location_records,
        (SELECT AVG(fuel_percentage)::DECIMAL(5,2) FROM trucks) as avg_fuel,
        (SELECT SUM(payload_tons) FROM trucks WHERE status = 'active') as total_payload
    `);
    
    const summary = stats.rows[0];
    
    log('='.repeat(60), 'blue');
    log('🎉 1000 DUMMY TRUCKS DATA GENERATION COMPLETE!', 'green');
    log('='.repeat(60), 'blue');
    log('📊 DATABASE SUMMARY:', 'cyan');
    log(`   🚛 Total Trucks: ${summary.total_trucks}`, 'cyan');
    log(`   🟢 Active Trucks: ${summary.active_trucks}`, 'cyan');
    log(`   ⚪ Inactive Trucks: ${summary.inactive_trucks}`, 'cyan');
    log(`   🔧 Maintenance Trucks: ${summary.maintenance_trucks}`, 'cyan');
    log(`   🛞 Tire Readings: ${summary.tire_readings}`, 'cyan');
    log(`   🚨 Active Alerts: ${summary.active_alerts}`, 'cyan');
    log(`   📍 Location Records: ${summary.location_records}`, 'cyan');
    log(`   ⛽ Average Fuel: ${summary.avg_fuel}%`, 'cyan');
    log(`   📦 Total Active Payload: ${summary.total_payload || 0} tons`, 'cyan');
    log('='.repeat(60), 'blue');
    log('✅ Backend testing data ready!', 'green');
    log('🚀 You can now start the server: npm run dev', 'magenta');
    
  } catch (error) {
    log('❌ Generation failed:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Export functions for use in other scripts
module.exports = {
  generateTruckData,
  generateAndInsertDummyData
};

// Run if executed directly
if (require.main === module) {
  const saveJson = process.argv.includes('--json');
  generateAndInsertDummyData(saveJson);
}