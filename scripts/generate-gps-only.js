/**
 * Generate GPS positions only for existing trucks
 * Run this after partitions are created
 */

const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

const GPS_POINTS_PER_TRUCK = 100;

// Mining area boundaries (PT Borneo Indobara approximate area)
const MINING_AREA = {
  center: { lat: -1.5, lng: 116.5 },
  bounds: {
    north: -1.0,
    south: -2.0,
    east: 117.0,
    west: 116.0
  }
};

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function generateRandomCoordinate() {
  return {
    latitude: randomFloat(MINING_AREA.bounds.south, MINING_AREA.bounds.north),
    longitude: randomFloat(MINING_AREA.bounds.west, MINING_AREA.bounds.east)
  };
}

function generateRealisticMovement(startLat, startLng, index) {
  const timeOffset = index * 60; // 1 minute intervals
  const baseTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago
  
  const latOffset = (Math.random() - 0.5) * 0.01;
  const lngOffset = (Math.random() - 0.5) * 0.01;
  
  return {
    latitude: startLat + latOffset,
    longitude: startLng + lngOffset,
    timestamp: new Date(baseTime.getTime() + (timeOffset * 1000)),
    speed: randomFloat(0, 60),
    heading: randomFloat(0, 360)
  };
}

async function generateGPSPositions() {
  console.log('Generating GPS positions for existing trucks...');
  
  // Get all trucks with their devices
  const trucks = await prisma.truck.findMany({
    include: {
      devices: true
    }
  });
  
  console.log(`Found ${trucks.length} trucks`);
  
  let totalPositions = 0;
  let successfulTrucks = 0;
  
  for (const truck of trucks) {
    try {
      if (truck.devices.length === 0) {
        console.log(`Skipping truck ${truck.plateNumber} - no device`);
        continue;
      }
      
      const device = truck.devices[0]; // Use first device
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
      successfulTrucks++;
      
      if (successfulTrucks % 100 === 0) {
        console.log(`✓ Generated GPS for ${successfulTrucks} trucks...`);
      }
      
    } catch (error) {
      console.error(`Error generating GPS for truck ${truck.plateNumber}:`, error.message);
    }
  }
  
  console.log(`✓ Generated ${totalPositions} GPS positions for ${successfulTrucks} trucks`);
  return totalPositions;
}

async function main() {
  try {
    const gpsCount = await generateGPSPositions();
    
    // Final summary
    console.log('\n=== GPS GENERATION SUMMARY ===');
    const totalGPS = await prisma.gpsPosition.count();
    console.log(`Total GPS positions in database: ${totalGPS}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
