const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Koordinat area PT INDOBARA
const PT_INDOBARA_BOUNDS = {
  minLat: -3.717200000114277,
  maxLat: -3.431898966201222,
  minLng: 115.432199323066001,
  maxLng: 115.658299919322602
};

// Fungsi untuk generate koordinat random dalam bounds
const generateRandomLocation = (baseLat, baseLng, radiusKm = 5) => {
  const radiusInDegrees = radiusKm / 111; // Approximation: 1 degree = 111 km
  
  const lat = baseLat + (Math.random() - 0.5) * 2 * radiusInDegrees;
  const lng = baseLng + (Math.random() - 0.5) * 2 * radiusInDegrees;
  
  // Ensure within PT INDOBARA bounds
  return {
    latitude: Math.max(PT_INDOBARA_BOUNDS.minLat, Math.min(PT_INDOBARA_BOUNDS.maxLat, lat)),
    longitude: Math.max(PT_INDOBARA_BOUNDS.minLng, Math.min(PT_INDOBARA_BOUNDS.maxLng, lng))
  };
};

// Fungsi untuk generate realistic truck movement pattern
const generateTruckMovementPattern = (startLat, startLng, duration = 24) => {
  const movements = [];
  let currentLat = startLat;
  let currentLng = startLng;
  let currentSpeed = 0;
  let currentHeading = Math.floor(Math.random() * 360);
  let currentFuel = 85 + Math.random() * 15; // Start with 85-100% fuel
  
  const intervalMinutes = 15; // Data point every 15 minutes
  const totalPoints = (duration * 60) / intervalMinutes;
  
  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - (i * intervalMinutes));
    
    // Simulate different truck states
    const state = Math.random();
    if (state < 0.1) {
      // 10% chance: Stationary (loading/unloading)
      currentSpeed = 0;
    } else if (state < 0.3) {
      // 20% chance: Slow movement (maneuvering)
      currentSpeed = 5 + Math.random() * 15;
      const newLocation = generateRandomLocation(currentLat, currentLng, 0.5);
      currentLat = newLocation.latitude;
      currentLng = newLocation.longitude;
      currentHeading += (Math.random() - 0.5) * 60; // Change heading
    } else {
      // 70% chance: Normal movement
      currentSpeed = 20 + Math.random() * 40;
      const newLocation = generateRandomLocation(currentLat, currentLng, 2);
      currentLat = newLocation.latitude;
      currentLng = newLocation.longitude;
      currentHeading += (Math.random() - 0.5) * 30;
    }
    
    // Normalize heading
    currentHeading = ((currentHeading % 360) + 360) % 360;
    
    // Simulate fuel consumption
    currentFuel -= (currentSpeed * intervalMinutes) / (60 * 30); // Rough consumption model
    currentFuel = Math.max(10, currentFuel); // Minimum 10% fuel
    
    movements.push({
      latitude: parseFloat(currentLat.toFixed(8)),
      longitude: parseFloat(currentLng.toFixed(8)),
      speed: parseFloat(currentSpeed.toFixed(2)),
      heading: Math.round(currentHeading),
      fuelPercentage: parseFloat(currentFuel.toFixed(2)),
      recordedAt: timestamp
    });
  }
  
  return movements.reverse(); // Return chronological order
};

// Fungsi untuk generate maintenance history
const generateMaintenanceHistory = async (truckId) => {
  const maintenanceTypes = [
    'Routine Service',
    'Tire Replacement',
    'Engine Maintenance',
    'Hydraulic System Check',
    'Brake Inspection',
    'Electrical System Check',
    'Transmission Service',
    'Cooling System Maintenance'
  ];
  
  const maintenanceRecords = [];
  const recordCount = 3 + Math.floor(Math.random() * 5); // 3-7 records per truck
  
  for (let i = 0; i < recordCount; i++) {
    const daysAgo = Math.floor(Math.random() * 365); // Within last year
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    const duration = 1 + Math.floor(Math.random() * 5); // 1-5 days
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);
    
    const maintenanceType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
    
    maintenanceRecords.push({
      truckId: truckId,
      maintenanceType: maintenanceType,
      description: `${maintenanceType} performed on truck. All systems checked and serviced according to schedule.`,
      startDate: startDate,
      endDate: endDate,
      cost: parseFloat((500 + Math.random() * 4500).toFixed(2)), // $500-$5000
      technicianName: `Technician ${Math.floor(Math.random() * 20) + 1}`,
      isCompleted: true,
      createdAt: startDate
    });
  }
  
  return maintenanceRecords;
};

// Fungsi untuk generate tire pressure history
const generateTirePressureHistory = async (truckId) => {
  const tirePositions = [
    'front_left', 'front_right', 
    'middle_left', 'middle_right', 
    'rear_left', 'rear_right'
  ];
  
  const pressureHistory = [];
  const daysHistory = 30; // 30 days of history
  
  for (let day = 0; day < daysHistory; day++) {
    for (let tireNum = 1; tireNum <= 6; tireNum++) {
      const recordDate = new Date();
      recordDate.setDate(recordDate.getDate() - day);
      recordDate.setHours(8 + Math.floor(Math.random() * 8)); // Random time 8AM-4PM
      
      // Base pressure with some variation over time
      const basePressure = 95 + Math.sin(day * 0.1) * 10; // Seasonal variation
      const pressure = basePressure + (Math.random() - 0.5) * 20; // Daily variation
      const temperature = 65 + Math.random() * 30; // 65-95°C
      
      let status = 'normal';
      if (pressure < 85) status = 'low';
      else if (pressure > 115) status = 'high';
      
      pressureHistory.push({
        truckId: truckId,
        tirePosition: tirePositions[tireNum - 1],
        tireNumber: tireNum,
        pressurePsi: parseFloat(pressure.toFixed(1)),
        status: status,
        temperature: parseFloat(temperature.toFixed(2)),
        recordedAt: recordDate
      });
    }
  }
  
  return pressureHistory;
};

// Fungsi untuk generate alert history
const generateAlertHistory = async (truckId) => {
  const alertTypes = [
    'Low Fuel Warning',
    'Engine Temperature High',
    'Tire Pressure Alert',
    'Scheduled Maintenance Due',
    'GPS Signal Lost',
    'Overload Warning',
    'Battery Voltage Low',
    'Hydraulic Pressure Alert',
    'Speed Limit Exceeded',
    'Unauthorized Engine Start'
  ];
  
  const severities = ['low', 'medium', 'high', 'critical'];
  const severityWeights = [0.4, 0.35, 0.2, 0.05]; // Most alerts are low-medium severity
  
  const alertHistory = [];
  const alertCount = Math.floor(Math.random() * 15) + 5; // 5-19 alerts per truck
  
  for (let i = 0; i < alertCount; i++) {
    const daysAgo = Math.floor(Math.random() * 90); // Within last 3 months
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    // Select severity based on weights
    const rand = Math.random();
    let severity = 'low';
    let cumulativeWeight = 0;
    for (let j = 0; j < severities.length; j++) {
      cumulativeWeight += severityWeights[j];
      if (rand < cumulativeWeight) {
        severity = severities[j];
        break;
      }
    }
    
    const isResolved = Math.random() < 0.8; // 80% resolved
    const resolvedAt = isResolved ? new Date(createdAt.getTime() + Math.random() * 86400000 * 3) : null; // Resolved within 3 days
    
    alertHistory.push({
      truckId: truckId,
      alertType: alertType,
      severity: severity,
      message: `${alertType}: Detected on truck ${truckId}. ${isResolved ? 'Issue resolved.' : 'Awaiting resolution.'}`,
      isResolved: isResolved,
      createdAt: createdAt,
      resolvedAt: resolvedAt
    });
  }
  
  return alertHistory;
};

// Main seeder function
const seedHistoryData = async () => {
  console.log('🌱 Starting history data seeding...');
  
  try {
    // Get all active trucks
    const trucks = await prisma.truck.findMany({
      where: { status: 'active' },
      take: 100 // Limit to first 100 trucks for demo
    });
    
    console.log(`Found ${trucks.length} active trucks for history generation`);
    
    let processedCount = 0;
    
    for (const truck of trucks) {
      console.log(`\n📊 Processing truck ${truck.truckNumber} (${++processedCount}/${trucks.length})`);
      
      // Generate location history
      if (truck.latitude && truck.longitude) {
        console.log('  📍 Generating location history...');
        const movements = generateTruckMovementPattern(
          parseFloat(truck.latitude.toString()),
          parseFloat(truck.longitude.toString()),
          48 // 48 hours of history
        );
        
        await prisma.locationHistory.createMany({
          data: movements.map(movement => ({
            truckId: truck.id,
            ...movement
          })),
          skipDuplicates: true
        });
        
        console.log(`    ✅ Created ${movements.length} location records`);
      }
      
      // Generate tire pressure history
      console.log('  🔧 Generating tire pressure history...');
      const tirePressureRecords = await generateTirePressureHistory(truck.id);
      
      // Delete existing records to avoid duplicates
      await prisma.tirePressure.deleteMany({
        where: { truckId: truck.id }
      });
      
      await prisma.tirePressure.createMany({
        data: tirePressureRecords,
        skipDuplicates: true
      });
      
      console.log(`    ✅ Created ${tirePressureRecords.length} tire pressure records`);
      
      // Generate maintenance history
      console.log('  🔨 Generating maintenance history...');
      const maintenanceRecords = await generateMaintenanceHistory(truck.id);
      
      for (const record of maintenanceRecords) {
        await prisma.maintenanceRecord.create({
          data: record
        });
      }
      
      console.log(`    ✅ Created ${maintenanceRecords.length} maintenance records`);
      
      // Generate alert history
      console.log('  🚨 Generating alert history...');
      const alertRecords = await generateAlertHistory(truck.id);
      
      await prisma.truckAlert.createMany({
        data: alertRecords,
        skipDuplicates: true
      });
      
      console.log(`    ✅ Created ${alertRecords.length} alert records`);
    }
    
    // Generate summary statistics
    console.log('\n📈 Generating summary statistics...');
    
    const stats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM location_history) as location_records,
        (SELECT COUNT(*) FROM tire_pressures) as tire_pressure_records,
        (SELECT COUNT(*) FROM maintenance_records) as maintenance_records,
        (SELECT COUNT(*) FROM truck_alerts) as alert_records,
        (SELECT COUNT(DISTINCT truck_id) FROM location_history) as trucks_with_history
    `;
    
    console.log('\n🎉 History data seeding completed!');
    console.log('📊 Final Statistics:');
    console.log(`   📍 Location Records: ${stats[0].location_records}`);
    console.log(`   🔧 Tire Pressure Records: ${stats[0].tire_pressure_records}`);
    console.log(`   🔨 Maintenance Records: ${stats[0].maintenance_records}`);
    console.log(`   🚨 Alert Records: ${stats[0].alert_records}`);
    console.log(`   🚛 Trucks with History: ${stats[0].trucks_with_history}`);
    
  } catch (error) {
    console.error('❌ Error seeding history data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Export for use as module
module.exports = {
  seedHistoryData,
  generateTruckMovementPattern,
  generateMaintenanceHistory,
  generateTirePressureHistory,
  generateAlertHistory
};

// Run if called directly
if (require.main === module) {
  seedHistoryData()
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}