/**
 * Generate 1000 trucks with comprehensive test data
 * Based on truck_tracking.md schema structure
 * 
 * This script generates:
 * - 1000 trucks with devices
 * - GPS positions with realistic movement patterns
 * - Tire pressure and hub temperature events
 * - Device status events
 * - Lock events and sensor data
 * - Alert events
 */

const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

// Configuration
const TOTAL_TRUCKS = 1000;
const GPS_POINTS_PER_TRUCK = 100; // Last 100 GPS points per truck
const TIRE_EVENTS_PER_TRUCK = 50;
const HUB_EVENTS_PER_TRUCK = 30;
const DEVICE_STATUS_EVENTS = 20;

// Mining area boundaries (PT Borneo Indobara approximate area)
const MINING_AREA = {
  center: { lat: -1.5, lng: 116.5 }, // Central Kalimantan
  bounds: {
    north: -1.0,
    south: -2.0,
    east: 117.0,
    west: 116.0
  }
};

// Utility functions
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomCoordinate() {
  return {
    latitude: randomFloat(MINING_AREA.bounds.south, MINING_AREA.bounds.north),
    longitude: randomFloat(MINING_AREA.bounds.west, MINING_AREA.bounds.east)
  };
}

function generateRealisticMovement(startLat, startLng, index) {
  // Simulate realistic truck movement patterns
  const timeOffset = index * 60; // 1 minute intervals
  const baseTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago
  
  // Add some randomness to movement
  const latOffset = (Math.random() - 0.5) * 0.01; // ~1km movement
  const lngOffset = (Math.random() - 0.5) * 0.01;
  
  return {
    latitude: startLat + latOffset,
    longitude: startLng + lngOffset,
    timestamp: new Date(baseTime.getTime() + (timeOffset * 1000)),
    speed: randomFloat(0, 60), // 0-60 km/h
    heading: randomFloat(0, 360)
  };
}

function generateDeviceSN(truckIndex) {
  return `346268${String(truckIndex).padStart(4, '0')}`;
}

function generateSimNumber(truckIndex) {
  return `12345${String(truckIndex).padStart(5, '0')}`;
}

async function createFleetGroup() {
  console.log('Creating fleet group...');
  
  try {
    // First try to find existing fleet group
    let fleetGroup = await prisma.fleetGroup.findFirst({
      where: { name: 'PT Borneo Indobara Mining Fleet' }
    });
    
    if (!fleetGroup) {
      // Create new fleet group if not exists
      fleetGroup = await prisma.fleetGroup.create({
        data: {
          name: 'PT Borneo Indobara Mining Fleet',
          site: 'Kalimantan Tengah',
          description: 'Main mining fleet with 1000 trucks for coal mining operations'
        }
      });
    }
    
    console.log(`✓ Fleet group ready: ${fleetGroup.id}`);
    return fleetGroup.id;
  } catch (error) {
    console.error('Error creating fleet group:', error);
    throw error;
  }
}

async function createTrucksWithDevices(fleetGroupId) {
  console.log(`Creating ${TOTAL_TRUCKS} trucks with devices...`);
  
  const truckModels = [
    'Caterpillar 797F',
    'Komatsu 980E-4',
    'Liebherr T 282C',
    'Caterpillar 795F AC',
    'Komatsu 830E-5'
  ];
  
  const trucks = [];
  
  for (let i = 1; i <= TOTAL_TRUCKS; i++) {
    try {
      const plateNumber = `B ${String(i).padStart(4, '0')} TR`;
      const deviceSN = generateDeviceSN(i);
      const simNumber = generateSimNumber(i);
      
      // Create truck
      const truck = await prisma.truck.create({
        data: {
          plateNumber,
          name: `Mining Truck ${String(i).padStart(3, '0')}`,
          model: randomChoice(truckModels),
          year: randomInt(2018, 2024),
          tireConfig: '6 tires',
          fleetGroupId
        }
      });
      
      // Create device for truck
      const device = await prisma.device.create({
        data: {
          truckId: truck.id,
          sn: deviceSN,
          simNumber
        }
      });
      
      trucks.push({ truck, device });
      
      if (i % 100 === 0) {
        console.log(`✓ Created ${i} trucks...`);
      }
      
    } catch (error) {
      console.error(`Error creating truck ${i}:`, error);
      // Continue with next truck
    }
  }
  
  console.log(`✓ Created ${trucks.length} trucks with devices`);
  return trucks;
}

async function generateGPSPositions(trucks) {
  console.log('Generating GPS positions...');
  
  let totalPositions = 0;
  
  for (const { truck, device } of trucks) {
    try {
      const startCoord = generateRandomCoordinate();
      let currentLat = startCoord.latitude;
      let currentLng = startCoord.longitude;
      
      const gpsData = [];
      
      for (let i = 0; i < GPS_POINTS_PER_TRUCK; i++) {
        const movement = generateRealisticMovement(currentLat, currentLng, i);
        currentLat = movement.latitude;
        currentLng = movement.longitude;
        
        gpsData.push({
          deviceId: device.id,
          truckId: truck.id,
          ts: movement.timestamp,
          speedKph: movement.speed,
          headingDeg: movement.heading,
          hdop: randomFloat(0.5, 3.0),
          source: 'iot_device'
        });
      }
      
      // Batch insert GPS positions
      await prisma.gpsPosition.createMany({
        data: gpsData,
        skipDuplicates: true
      });
      
      totalPositions += gpsData.length;
      
    } catch (error) {
      console.error(`Error generating GPS for truck ${truck.plateNumber}:`, error);
    }
  }
  
  console.log(`✓ Generated ${totalPositions} GPS positions`);
}

async function generateTirePressureEvents(trucks) {
  console.log('Generating tire pressure events...');
  
  let totalEvents = 0;
  
  for (const { truck, device } of trucks) {
    try {
      const events = [];
      
      for (let i = 0; i < TIRE_EVENTS_PER_TRUCK; i++) {
        const tireNo = randomInt(1, 6); // 6 tires per truck
        const timestamp = new Date(Date.now() - randomInt(0, 24 * 60 * 60 * 1000));
        
        events.push({
          deviceId: device.id,
          truckId: truck.id,
          tireNo,
          pressureKpa: randomFloat(800, 1200), // Normal tire pressure range
          tempCelsius: randomFloat(40, 80), // Operating temperature
          exType: randomChoice(['0', '1', '2', '1,3']),
          batteryLevel: randomInt(20, 100),
          changedAt: timestamp
        });
      }
      
      await prisma.tirePressureEvent.createMany({
        data: events,
        skipDuplicates: true
      });
      
      totalEvents += events.length;
      
    } catch (error) {
      console.error(`Error generating tire events for truck ${truck.plateNumber}:`, error);
    }
  }
  
  console.log(`✓ Generated ${totalEvents} tire pressure events`);
}

async function generateHubTemperatureEvents(trucks) {
  console.log('Generating hub temperature events...');
  
  let totalEvents = 0;
  
  for (const { truck, device } of trucks) {
    try {
      const events = [];
      
      for (let i = 0; i < HUB_EVENTS_PER_TRUCK; i++) {
        const hubNo = randomInt(1, 6); // 6 hubs per truck
        const timestamp = new Date(Date.now() - randomInt(0, 24 * 60 * 60 * 1000));
        
        events.push({
          deviceId: device.id,
          truckId: truck.id,
          hubNo,
          tempCelsius: randomFloat(60, 120), // Hub operating temperature
          exType: randomChoice(['0', '1', '2']),
          batteryLevel: randomInt(20, 100),
          changedAt: timestamp
        });
      }
      
      await prisma.hubTemperatureEvent.createMany({
        data: events,
        skipDuplicates: true
      });
      
      totalEvents += events.length;
      
    } catch (error) {
      console.error(`Error generating hub events for truck ${truck.plateNumber}:`, error);
    }
  }
  
  console.log(`✓ Generated ${totalEvents} hub temperature events`);
}

async function generateDeviceStatusEvents(trucks) {
  console.log('Generating device status events...');
  
  let totalEvents = 0;
  
  for (const { truck, device } of trucks) {
    try {
      const events = [];
      
      for (let i = 0; i < DEVICE_STATUS_EVENTS; i++) {
        const timestamp = new Date(Date.now() - randomInt(0, 24 * 60 * 60 * 1000));
        
        events.push({
          deviceId: device.id,
          truckId: truck.id,
          hostBat: randomInt(20, 100),
          repeater1Bat: randomInt(20, 100),
          repeater2Bat: randomInt(20, 100),
          lockState: randomChoice([0, 1]),
          reportedAt: timestamp
        });
      }
      
      await prisma.deviceStatusEvent.createMany({
        data: events,
        skipDuplicates: true
      });
      
      totalEvents += events.length;
      
    } catch (error) {
      console.error(`Error generating device status for truck ${truck.plateNumber}:`, error);
    }
  }
  
  console.log(`✓ Generated ${totalEvents} device status events`);
}

async function generateAlertEvents(trucks) {
  console.log('Generating alert events...');
  
  const alertTypes = ['LOW_TIRE', 'SPEEDING', 'IDLE', 'HIGH_TEMP', 'DEVICE_LOST'];
  let totalAlerts = 0;
  
  for (const { truck } of trucks) {
    try {
      // Generate 0-5 alerts per truck (some trucks have no alerts)
      const alertCount = randomInt(0, 5);
      const alerts = [];
      
      for (let i = 0; i < alertCount; i++) {
        const alertType = randomChoice(alertTypes);
        const timestamp = new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)); // Last week
        
        alerts.push({
          truckId: truck.id,
          type: alertType,
          severity: randomInt(1, 5),
          detail: {
            message: `${alertType} alert for truck ${truck.plateNumber}`,
            value: randomFloat(0, 100),
            threshold: randomFloat(50, 90)
          },
          occurredAt: timestamp,
          acknowledged: randomChoice([true, false])
        });
      }
      
      if (alerts.length > 0) {
        await prisma.alertEvent.createMany({
          data: alerts,
          skipDuplicates: true
        });
        totalAlerts += alerts.length;
      }
      
    } catch (error) {
      console.error(`Error generating alerts for truck ${truck.plateNumber}:`, error);
    }
  }
  
  console.log(`✓ Generated ${totalAlerts} alert events`);
}

async function generateFuelAndSpeedEvents(trucks) {
  console.log('Generating fuel and speed events...');
  
  let totalFuelEvents = 0;
  let totalSpeedEvents = 0;
  
  for (const { truck } of trucks) {
    try {
      // Generate fuel level events (10-20 per truck)
      const fuelEventCount = randomInt(10, 20);
      const fuelEvents = [];
      
      for (let i = 0; i < fuelEventCount; i++) {
        const timestamp = new Date(Date.now() - randomInt(0, 24 * 60 * 60 * 1000));
        fuelEvents.push({
          truckId: truck.id,
          fuelPercent: randomFloat(10, 100),
          changedAt: timestamp,
          source: 'fuel_sensor'
        });
      }
      
      await prisma.fuelLevelEvent.createMany({
        data: fuelEvents,
        skipDuplicates: true
      });
      totalFuelEvents += fuelEvents.length;
      
      // Generate speed events (15-25 per truck)
      const speedEventCount = randomInt(15, 25);
      const speedEvents = [];
      
      for (let i = 0; i < speedEventCount; i++) {
        const timestamp = new Date(Date.now() - randomInt(0, 24 * 60 * 60 * 1000));
        speedEvents.push({
          truckId: truck.id,
          speedKph: randomFloat(0, 80),
          changedAt: timestamp,
          source: 'gps_calculated'
        });
      }
      
      await prisma.speedEvent.createMany({
        data: speedEvents,
        skipDuplicates: true
      });
      totalSpeedEvents += speedEvents.length;
      
    } catch (error) {
      console.error(`Error generating fuel/speed events for truck ${truck.plateNumber}:`, error);
    }
  }
  
  console.log(`✓ Generated ${totalFuelEvents} fuel events and ${totalSpeedEvents} speed events`);
}

async function generateLockEvents(trucks) {
  console.log('Generating lock events...');
  
  let totalEvents = 0;
  
  for (const { truck, device } of trucks) {
    try {
      // Generate 5-15 lock events per truck
      const eventCount = randomInt(5, 15);
      const events = [];
      
      for (let i = 0; i < eventCount; i++) {
        const timestamp = new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000));
        events.push({
          deviceId: device.id,
          truckId: truck.id,
          isLock: randomChoice([0, 1]),
          reportedAt: timestamp
        });
      }
      
      await prisma.lockEvent.createMany({
        data: events,
        skipDuplicates: true
      });
      
      totalEvents += events.length;
      
    } catch (error) {
      console.error(`Error generating lock events for truck ${truck.plateNumber}:`, error);
    }
  }
  
  console.log(`✓ Generated ${totalEvents} lock events`);
}

async function generateDataSummary() {
  console.log('\n=== DATA GENERATION SUMMARY ===');
  
  try {
    const counts = await Promise.all([
      prisma.truck.count(),
      prisma.device.count(),
      prisma.gpsPosition.count(),
      prisma.tirePressureEvent.count(),
      prisma.hubTemperatureEvent.count(),
      prisma.deviceStatusEvent.count(),
      prisma.alertEvent.count(),
      prisma.fuelLevelEvent.count(),
      prisma.speedEvent.count(),
      prisma.lockEvent.count()
    ]);
    
    console.log(`Trucks: ${counts[0]}`);
    console.log(`Devices: ${counts[1]}`);
    console.log(`GPS Positions: ${counts[2]}`);
    console.log(`Tire Pressure Events: ${counts[3]}`);
    console.log(`Hub Temperature Events: ${counts[4]}`);
    console.log(`Device Status Events: ${counts[5]}`);
    console.log(`Alert Events: ${counts[6]}`);
    console.log(`Fuel Level Events: ${counts[7]}`);
    console.log(`Speed Events: ${counts[8]}`);
    console.log(`Lock Events: ${counts[9]}`);
    
    const totalRecords = counts.reduce((sum, count) => sum + count, 0);
    console.log(`\nTotal Records Generated: ${totalRecords.toLocaleString()}`);
    
  } catch (error) {
    console.error('Error generating summary:', error);
  }
}

async function main() {
  console.log('🚛 Starting 1000 Trucks Data Generation...\n');
  
  try {
    // Step 1: Create fleet group
    const fleetGroupId = await createFleetGroup();
    
    // Step 2: Create trucks with devices
    const trucks = await createTrucksWithDevices(fleetGroupId);
    
    if (trucks.length === 0) {
      throw new Error('No trucks were created successfully');
    }
    
    // Step 3: Generate GPS positions
    await generateGPSPositions(trucks);
    
    // Step 4: Generate tire pressure events
    await generateTirePressureEvents(trucks);
    
    // Step 5: Generate hub temperature events
    await generateHubTemperatureEvents(trucks);
    
    // Step 6: Generate device status events
    await generateDeviceStatusEvents(trucks);
    
    // Step 7: Generate alert events
    await generateAlertEvents(trucks);
    
    // Step 8: Generate fuel and speed events
    await generateFuelAndSpeedEvents(trucks);
    
    // Step 9: Generate lock events
    await generateLockEvents(trucks);
    
    // Step 10: Generate summary
    await generateDataSummary();
    
    console.log('\n✅ Data generation completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during data generation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  TOTAL_TRUCKS,
  GPS_POINTS_PER_TRUCK
};
