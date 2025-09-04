const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Koordinat rute yang diberikan user
const routeCoordinates = [
  [-3.506761, 115.624602], [-3.506831, 115.624709], [-3.506925, 115.624882],
  [-3.507028, 115.625017], [-3.507139, 115.625174], [-3.507221, 115.625322],
  [-3.507603, 115.625873], [-3.507746, 115.626132], [-3.507841, 115.626260],
  [-3.507927, 115.626371], [-3.508066, 115.626490], [-3.508177, 115.626646],
  [-3.508313, 115.626803], [-3.508420, 115.626930], [-3.508403, 115.626905],
  [-3.508502, 115.627021], [-3.508645, 115.627177], [-3.508828, 115.627354],
  [-3.508963, 115.627512], [-3.509174, 115.627706], [-3.509418, 115.627918],
  [-3.509634, 115.628112], [-3.509931, 115.628342], [-3.510025, 115.628491],
  [-3.510138, 115.628622], [-3.510260, 115.628766], [-3.510399, 115.628956],
  [-3.510597, 115.629145], [-3.511003, 115.629446], [-3.511238, 115.629505],
  [-3.511399, 115.629564], [-3.511613, 115.629623], [-3.511843, 115.629639],
  [-3.512015, 115.629666], [-3.512154, 115.629715], [-3.512475, 115.629677],
  [-3.512764, 115.629602], [-3.512903, 115.629564], [-3.513150, 115.629511],
  [-3.513284, 115.629462], [-3.513235, 115.629296], [-3.513193, 115.629087],
  [-3.513134, 115.628867], [-3.513128, 115.628685], [-3.513235, 115.628593],
  [-3.513401, 115.628534], [-3.513562, 115.628470], [-3.513749, 115.628459],
  [-3.513926, 115.628406], [-3.514135, 115.628384]
];

async function insertRouteData() {
  try {
    console.log('🚛 Inserting live tracking route data...');
    
    // Ambil truck pertama untuk demo
    const truck = await prisma.truck.findFirst({
      select: { id: true, truckNumber: true, model: true }
    });

    if (!truck) {
      console.log('❌ No trucks found in database');
      return;
    }

    console.log(`📊 Using truck: ${truck.truckNumber} (${truck.model || 'Unknown Model'})`);
    
    const gpsData = [];
    const startTime = new Date();
    
    // Generate GPS data untuk setiap koordinat
    for (let i = 0; i < routeCoordinates.length; i++) {
      const [latitude, longitude] = routeCoordinates[i];
      const timestamp = new Date(startTime.getTime() + (i * 30000)); // 30 detik interval
      
      // Hitung kecepatan dan heading
      let speed = 25 + Math.random() * 20; // 25-45 km/h
      let heading = Math.random() * 360;
      
      if (i > 0) {
        const [prevLat, prevLon] = routeCoordinates[i - 1];
        // Hitung bearing sederhana
        const dLon = longitude - prevLon;
        const dLat = latitude - prevLat;
        heading = Math.atan2(dLon, dLat) * 180 / Math.PI;
        if (heading < 0) heading += 360;
      }

      // GPS Position sesuai schema Prisma
      const gpsRecord = {
        truckId: truck.id,
        ts: timestamp,
        speedKph: speed,
        headingDeg: heading,
        hdop: 1.2 + Math.random() * 0.8,
        source: 'simulation'
      };

      gpsData.push(gpsRecord);
    }

    // Insert data ke database satu per satu karena geography field
    let insertedCount = 0;
    for (const gpsRecord of gpsData) {
      try {
        await prisma.gpsPosition.create({
          data: gpsRecord
        });
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting GPS record:`, error.message);
      }
    }

    // Update truck status - schema tidak memiliki currentLatitude/currentLongitude
    // Hanya update status event
    await prisma.truckStatusEvent.create({
      data: {
        truckId: truck.id,
        status: 'ACTIVE',
        note: 'Live tracking route data inserted'
      }
    });

    console.log(`✅ Successfully inserted ${insertedCount} GPS records`);
    console.log(`📍 Route: ${routeCoordinates.length} points`);
    console.log(`🚛 Truck: ${truck.truckNumber}`);
    console.log(`⏱️  Duration: ${routeCoordinates.length * 30} seconds`);
    console.log(`📊 Start: [${routeCoordinates[0][0]}, ${routeCoordinates[0][1]}]`);
    const lastCoordinate = routeCoordinates[routeCoordinates.length - 1];
    console.log(`📊 End: [${lastCoordinate[0]}, ${lastCoordinate[1]}]`);
    
  } catch (error) {
    console.error('❌ Error inserting route data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  insertRouteData();
}

module.exports = { insertRouteData, routeCoordinates };
