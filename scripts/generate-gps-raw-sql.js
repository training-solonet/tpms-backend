/**
 * Generate GPS positions using raw SQL to handle PostGIS geometry
 * This bypasses Prisma's issues with generated columns
 */

const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

const GPS_POINTS_PER_TRUCK = 100;

// Mining area boundaries (PT Borneo Indobara approximate area)
const MINING_AREA = {
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

async function generateGPSWithRawSQL() {
  console.log('Generating GPS positions using raw SQL...');
  
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
      
      // Generate GPS points for this truck
      for (let i = 0; i < GPS_POINTS_PER_TRUCK; i++) {
        const movement = generateRealisticMovement(currentLat, currentLng, i);
        currentLat = movement.latitude;
        currentLng = movement.longitude;
        
        // Use raw SQL to insert GPS position with PostGIS geometry
        await prisma.$executeRaw`
          INSERT INTO gps_position (
            device_id, truck_id, ts, pos, longitude, latitude, 
            speed_kph, heading_deg, hdop, source
          ) VALUES (
            ${device.id}::uuid,
            ${truck.id}::uuid,
            ${movement.timestamp}::timestamptz,
            ST_SetSRID(ST_MakePoint(${movement.longitude}, ${movement.latitude}), 4326)::geography,
            ${movement.longitude}::decimal(10,7),
            ${movement.latitude}::decimal(10,7),
            ${movement.speed}::real,
            ${movement.heading}::real,
            ${randomFloat(0.5, 3.0)}::real,
            'iot_device'
          )
        `;
        
        totalPositions++;
      }
      
      successfulTrucks++;
      
      if (successfulTrucks % 50 === 0) {
        console.log(`✓ Generated GPS for ${successfulTrucks} trucks (${totalPositions} total positions)...`);
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
    const gpsCount = await generateGPSWithRawSQL();
    
    // Final summary
    console.log('\n=== GPS GENERATION SUMMARY ===');
    const totalGPS = await prisma.gpsPosition.count();
    console.log(`Total GPS positions in database: ${totalGPS}`);
    
    // Get sample of latest positions
    const samplePositions = await prisma.$queryRaw`
      SELECT 
        t.plate_number,
        gp.longitude,
        gp.latitude,
        gp.speed_kph,
        gp.ts
      FROM gps_position gp
      JOIN truck t ON t.id = gp.truck_id
      ORDER BY gp.ts DESC
      LIMIT 5
    `;
    
    console.log('\nSample GPS positions:');
    console.table(samplePositions);
    
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
