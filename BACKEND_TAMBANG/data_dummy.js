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

// Realistic truck data arrays
const truckModels = [
  { name: '797F', manufacturer: 'Caterpillar', capacity: 400, fuelTank: 4540 },
  { name: '980E-4', manufacturer: 'Komatsu', capacity: 360, fuelTank: 4000 },
  { name: 'T284', manufacturer: 'Liebherr', capacity: 400, fuelTank: 4730 },
  { name: '789D', manufacturer: 'Caterpillar', capacity: 195, fuelTank: 2650 },
  { name: '830E', manufacturer: 'Komatsu', capacity: 220, fuelTank: 3030 },
  { name: 'MT6300AC', manufacturer: 'Caterpillar', capacity: 400, fuelTank: 4200 },
  { name: '960E-2K', manufacturer: 'Komatsu', capacity: 290, fuelTank: 3800 },
  { name: 'T282C', manufacturer: 'Liebherr', capacity: 363, fuelTank: 4160 }
];

const driverNames = [
  'Ahmad Susanto', 'Budi Hartono', 'Chandra Wijaya', 'Dedi Kurniawan', 'Eko Prasetyo',
  'Fajar Nugroho', 'Gunawan Saputra', 'Hendri Setiawan', 'Indra Permana', 'Joko Widodo',
  'Kurnia Rahman', 'Lucky Hakim', 'Muhammad Rizki', 'Nanda Pratama', 'Oscar Simanjuntak',
  'Putra Mahendra', 'Qomar Hidayat', 'Rendi Sanjaya', 'Sandi Wibowo', 'Taufik Ismail',
  'Udin Sedunia', 'Vicky Ramadhan', 'Wahyu Santoso', 'Xavier Tobing', 'Yudi Pranata',
  'Zainal Abidin', 'Agus Salim', 'Bambang Sutrisno', 'Catur Pamungkas', 'Dwi Cahyono',
  'Erik Gunawan', 'Fadli Hassan', 'Gilang Ramadhan', 'Heri Suryanto', 'Ivan Kusuma',
  'Jajang Nurjaman', 'Krisna Wijaya', 'Lutfi Hakim', 'Maman Suryaman', 'Noval Hidayat',
  'Oki Prasetya', 'Pandu Wicaksono', 'Qadri Rahman', 'Reza Pahlevi', 'Soni Hermawan',
  'Teguh Prayoga', 'Ucok Siagian', 'Vino Bastian', 'Wawan Setiawan', 'Yoga Pratama'
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
    
    // Random model
    const model = truckModels[Math.floor(Math.random() * truckModels.length)];
    
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
      // Additional realistic fields
      fuelConsumption: Math.round((15 + Math.random() * 25) * 10) / 10, // L/hour
      averageSpeed: Math.round((status === 'active' ? 20 + Math.random() * 15 : 0) * 10) / 10,
      totalDistance: Math.round((Math.random() * 500) * 10) / 10, // km today
      workingHours: status === 'active' ? Math.round((4 + Math.random() * 8) * 10) / 10 : 0,
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
    
    if (count === 0) {
      log('Inserting truck models...', 'yellow');
      
      for (const model of truckModels) {
        await pool.query(`
          INSERT INTO truck_models (name, manufacturer, capacity_tons, fuel_tank_capacity)
          VALUES ($1, $2, $3, $4)
        `, [model.name, model.manufacturer, model.capacity, model.fuelTank]);
      }
      
      log(`✓ ${truckModels.length} truck models inserted!`, 'green');
    } else {
      log(`✓ Found ${count} existing truck models`, 'green');
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
    await pool.query('DELETE FROM truck_alerts');  
    await pool.query('DELETE FROM tire_pressures');
    await pool.query('DELETE FROM trucks');
    
    log('✓ Existing data cleared!', 'green');
  } catch (error) {
    log(`Error clearing data: ${error.message}`, 'red');
    throw error;
  }
};

// Insert trucks in batches
const insertTrucks = async (trucks) => {
  log('Inserting 1000 trucks...', 'yellow');
  
  try {
    // Get truck model IDs
    const modelsResult = await pool.query('SELECT id, name, manufacturer FROM truck_models');
    const modelMap = {};
    modelsResult.rows.forEach(row => {
      modelMap[`${row.manufacturer}-${row.name}`] = row.id;
    });
    
    const batchSize = 100;
    const totalBatches = Math.ceil(trucks.length / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, trucks.length);
      const batchTrucks = trucks.slice(startIdx, endIdx);
      
      const values = [];
      const placeholders = [];
      
      batchTrucks.forEach((truck, index) => {
        const modelKey = `${truck.model.manufacturer}-${truck.model.name}`;
        const modelId = modelMap[modelKey];
        
        const baseIndex = index * 12;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, 
          ST_SetSRID(ST_MakePoint($${baseIndex + 4}, $${baseIndex + 5}), 4326), 
          $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, 
          $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13})`);
        
        values.push(
          truck.truckNumber,
          modelId,
          truck.status,
          truck.location.coordinates[0], // longitude
          truck.location.coordinates[1], // latitude  
          truck.speed,
          truck.heading,
          truck.fuel,
          truck.payload,
          truck.driver,
          truck.engineHours,
          truck.odometer,
          truck.lastMaintenance
        );
      });
      
      const insertQuery = `
        INSERT INTO trucks (
          truck_number, model_id, status, current_location, speed,
          heading, fuel_percentage, payload_tons, driver_name,
          engine_hours, odometer, last_maintenance
        ) VALUES ${placeholders.join(', ')}
        RETURNING id, truck_number
      `;
      
      const result = await pool.query(insertQuery, values);
      
      // Store truck IDs for later use
      result.rows.forEach((row, index) => {
        batchTrucks[index].dbId = row.id;
      });
      
      log(`✓ Batch ${batch + 1}/${totalBatches} trucks inserted (${result.rows.length} trucks)`, 'cyan');
    }
    
    log('✅ All 1000 trucks inserted successfully!', 'green');
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
    const batchSize = 200; // 200 trucks at a time
    const totalBatches = Math.ceil(trucks.length / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, trucks.length);
      const batchTrucks = trucks.slice(startIdx, endIdx);
      
      const values = [];
      const placeholders = [];
      
      batchTrucks.forEach(truck => {
        truck.tirePressures.forEach(tire => {
          const baseIndex = values.length;
          placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, 
            $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`);
          
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
    const trucksWithAlerts = trucks.filter(truck => truck.alerts.length > 0);
    
    const values = [];
    const placeholders = [];
    
    trucksWithAlerts.forEach(truck => {
      truck.alerts.forEach(alert => {
        const baseIndex = values.length;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, 
          $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`);
        
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
    
    if (values.length > 0) {
      const insertQuery = `
        INSERT INTO truck_alerts (
          truck_id, alert_type, severity, message, is_resolved, created_at
        ) VALUES ${placeholders.join(', ')}
      `;
      
      await pool.query(insertQuery, values);
      
      log(`✅ ${values.length / 6} alerts inserted for ${trucksWithAlerts.length} trucks!`, 'green');
    } else {
      log('No alerts to insert', 'yellow');
    }
    
  } catch (error) {
    log(`Error inserting alerts: ${error.message}`, 'red');
    throw error;
  }
};

// Insert location history for active trucks
const insertLocationHistory = async (trucks) => {
  log('Inserting location history...', 'yellow');
  
  try {
    const activeTrucks = trucks.filter(truck => truck.status === 'active');
    log(`Generating history for ${activeTrucks.length} active trucks...`, 'cyan');
    
    const values = [];
    const placeholders = [];
    
    activeTrucks.forEach(truck => {
      // Generate 24 hours of history (every 30 minutes = 48 points)
      for (let hour = 0; hour < 48; hour++) {
        const timestamp = new Date();
        timestamp.setMinutes(timestamp.getMinutes() - (hour * 30));
        
        // Create movement pattern around current location
        const currentLng = truck.location.coordinates[0];
        const currentLat = truck.location.coordinates[1];
        
        // Realistic movement (within 0.01 degrees ~1km radius)
        const movementRadius = 0.01;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * movementRadius;
        
        const lng = currentLng + (distance * Math.cos(angle));
        const lat = currentLat + (distance * Math.sin(angle));
        
        const speed = Math.round((10 + Math.random() * 50) * 10) / 10; // 10-60 km/h
        const heading = Math.round(Math.random() * 360);
        const fuel = Math.max(10, truck.fuel + (Math.random() - 0.7) * 2); // Gradual fuel decrease
        
        const baseIndex = values.length;
        placeholders.push(`($${baseIndex + 1}, ST_SetSRID(ST_MakePoint($${baseIndex + 2}, $${baseIndex + 3}), 4326), 
          $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`);
        
        values.push(truck.dbId, lng, lat, speed, heading, fuel, timestamp);
      }
    });
    
    // Insert in smaller batches to avoid memory issues
    const batchSize = 2000; // 2000 records at a time
    const totalBatches = Math.ceil(placeholders.length / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, placeholders.length);
      
      const batchPlaceholders = placeholders.slice(startIdx, endIdx);
      const batchValues = values.slice(startIdx * 7, endIdx * 7);
      
      const insertQuery = `
        INSERT INTO location_history (truck_id, location, speed, heading, fuel_percentage, recorded_at)
        VALUES ${batchPlaceholders.join(', ')}
      `;
      
      await pool.query(insertQuery, batchValues);
      
      log(`✓ Location history batch ${batch + 1}/${totalBatches} inserted`, 'cyan');
    }
    
    log(`✅ Location history inserted for ${activeTrucks.length} active trucks!`, 'green');
    
  } catch (error) {
    log(`Error inserting location history: ${error.message}`, 'red');
    throw error;
  }
};

// Generate and save to JSON file for testing
const saveToJsonFile = (trucks) => {
  const fs = require('fs');
  
  log('Saving data to JSON file...', 'yellow');
  
  try {
    const jsonData = {
      metadata: {
        totalTrucks: trucks.length,
        generatedAt: new Date().toISOString(),
        summary: {
          active: trucks.filter(t => t.status === 'active').length,
          inactive: trucks.filter(t => t.status === 'inactive').length,
          maintenance: trucks.filter(t => t.status === 'maintenance').length,
          withAlerts: trucks.filter(t => t.alerts.length > 0).length,
          lowTirePressure: trucks.filter(t => 
            t.tirePressures.some(tire => tire.status === 'low')
          ).length
        }
      },
      trucks: trucks
    };
    
    fs.writeFileSync('dummy-trucks-data.json', JSON.stringify(jsonData, null, 2));
    log('✅ Data saved to dummy-trucks-data.json', 'green');
    
  } catch (error) {
    log(`Error saving JSON: ${error.message}`, 'red');
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
    
    // Save to JSON if requested
    if (saveJson) {
      saveToJsonFile(trucks);
    }
    
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
  generateAndInsertDummyData,
  saveToJsonFile
};

// Run if executed directly
if (require.main === module) {
  const saveJson = process.argv.includes('--json');
  generateAndInsertDummyData(saveJson);
}