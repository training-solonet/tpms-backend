const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Koordinat rute live tracking yang diberikan user
const routeCoordinates = [
  [-3.506761, 115.624602],
  [-3.506831, 115.624709],
  [-3.506925, 115.624882],
  [-3.507028, 115.625017],
  [-3.507139, 115.625174],
  [-3.507221, 115.625322],
  [-3.507603, 115.625873],
  [-3.507746, 115.626132],
  [-3.507841, 115.626260],
  [-3.507927, 115.626371],
  [-3.508066, 115.626490],
  [-3.508177, 115.626646],
  [-3.508313, 115.626803],
  [-3.508420, 115.626930],
  [-3.508403, 115.626905],
  [-3.508502, 115.627021],
  [-3.508645, 115.627177],
  [-3.508828, 115.627354],
  [-3.508963, 115.627512],
  [-3.509174, 115.627706],
  [-3.509418, 115.627918],
  [-3.509634, 115.628112],
  [-3.509931, 115.628342],
  [-3.510025, 115.628491],
  [-3.510138, 115.628622],
  [-3.510260, 115.628766],
  [-3.510399, 115.628956],
  [-3.510597, 115.629145],
  [-3.511003, 115.629446],
  [-3.511238, 115.629505],
  [-3.511399, 115.629564],
  [-3.511613, 115.629623],
  [-3.511843, 115.629639],
  [-3.512015, 115.629666],
  [-3.512154, 115.629715],
  [-3.512475, 115.629677],
  [-3.512764, 115.629602],
  [-3.512903, 115.629564],
  [-3.513150, 115.629511],
  [-3.513284, 115.629462],
  [-3.513235, 115.629296],
  [-3.513193, 115.629087],
  [-3.513134, 115.628867],
  [-3.513128, 115.628685],
  [-3.513235, 115.628593],
  [-3.513401, 115.628534],
  [-3.513562, 115.628470],
  [-3.513749, 115.628459],
  [-3.513926, 115.628406],
  [-3.514135, 115.628384]
];

// Fungsi untuk menghitung kecepatan berdasarkan jarak dan waktu
function calculateSpeed(lat1, lon1, lat2, lon2, timeIntervalSeconds) {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Jarak dalam km
  
  const speedKmh = (distance / timeIntervalSeconds) * 3600; // km/h
  return Math.max(0, Math.min(speedKmh, 80)); // Batasi kecepatan 0-80 km/h
}

// Fungsi untuk menghitung heading/bearing
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize ke 0-360 derajat
}

async function generateLiveTrackingData() {
  try {
    console.log('🚛 Starting live tracking route data generation...');
    
    // Ambil beberapa truck yang akan digunakan untuk tracking
    const trucks = await prisma.truck.findMany({
      take: 5, // Ambil 5 truck pertama
      select: {
        id: true,
        truckNumber: true,
        name: true
      }
    });

    if (trucks.length === 0) {
      console.log('❌ No trucks found in database');
      return;
    }

    console.log(`📊 Found ${trucks.length} trucks for live tracking`);
    
    const batchSize = 100;
    const timeInterval = 30; // 30 detik antar titik
    let totalInserted = 0;

    for (let truckIndex = 0; truckIndex < trucks.length; truckIndex++) {
      const truck = trucks[truckIndex];
      const gpsData = [];
      
      console.log(`🚛 Generating route for ${truck.truckNumber} (${truck.name})`);
      
      // Generate data untuk setiap koordinat dalam rute
      for (let i = 0; i < routeCoordinates.length; i++) {
        const [latitude, longitude] = routeCoordinates[i];
        
        // Waktu mulai dari sekarang, dengan interval antar titik
        const timestamp = new Date(Date.now() + (i * timeInterval * 1000) + (truckIndex * 300000)); // Offset antar truck 5 menit
        
        // Hitung kecepatan dan heading jika bukan titik pertama
        let speed = 0;
        let heading = 0;
        
        if (i > 0) {
          const [prevLat, prevLon] = routeCoordinates[i - 1];
          speed = calculateSpeed(prevLat, prevLon, latitude, longitude, timeInterval);
          heading = calculateBearing(prevLat, prevLon, latitude, longitude);
        }

        // Generate data sensor tambahan
        const sensorData = {
          device_id: `DEVICE_${truck.truckNumber.replace(/\s+/g, '_')}`,
          truck_id: truck.id,
          latitude: latitude,
          longitude: longitude,
          altitude: Math.random() * 50 + 100, // 100-150m altitude
          speed: speed,
          heading: heading,
          satellites: Math.floor(Math.random() * 5) + 8, // 8-12 satellites
          hdop: Math.random() * 2 + 1, // 1-3 HDOP
          recorded_at: timestamp,
          received_at: new Date(timestamp.getTime() + Math.random() * 5000), // Delay 0-5 detik
          
          // Data tambahan untuk mining truck
          fuel_level: Math.random() * 30 + 50, // 50-80% fuel
          engine_temp: Math.random() * 20 + 80, // 80-100°C
          engine_rpm: Math.random() * 1000 + 1200, // 1200-2200 RPM
          payload_weight: Math.random() * 50 + 150, // 150-200 ton
          tire_pressure_fl: Math.random() * 20 + 80, // 80-100 PSI
          tire_pressure_fr: Math.random() * 20 + 80,
          tire_pressure_rl: Math.random() * 20 + 80,
          tire_pressure_rr: Math.random() * 20 + 80,
          
          // Status operasional
          is_moving: speed > 5,
          is_idle: speed < 2,
          engine_status: speed > 0 ? 'running' : 'idle',
          driver_id: `DRIVER_${Math.floor(Math.random() * 100) + 1}`,
          
          // Geofencing data
          geofence_status: 'inside_mining_area',
          zone_id: 'ZONE_MINING_001'
        };

        gpsData.push(sensorData);
      }
      
      // Insert data dalam batch
      for (let i = 0; i < gpsData.length; i += batchSize) {
        const batch = gpsData.slice(i, i + batchSize);
        
        try {
          await prisma.gpsPosition.createMany({
            data: batch,
            skipDuplicates: true
          });
          
          totalInserted += batch.length;
          console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} for ${truck.truckNumber}: ${batch.length} records`);
        } catch (error) {
          console.error(`❌ Error inserting batch for ${truck.truckNumber}:`, error.message);
        }
      }
      
      // Update truck status dan lokasi terakhir
      try {
        const lastCoordinate = routeCoordinates[routeCoordinates.length - 1];
        await prisma.truck.update({
          where: { id: truck.id },
          data: {
            status: 'ACTIVE',
            currentLatitude: lastCoordinate[0],
            currentLongitude: lastCoordinate[1],
            lastSeen: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`📍 Updated ${truck.truckNumber} location to final position`);
      } catch (error) {
        console.error(`❌ Error updating truck ${truck.truckNumber}:`, error.message);
      }
    }
    
    console.log(`🎉 Live tracking route generation completed!`);
    console.log(`📊 Total GPS records inserted: ${totalInserted}`);
    console.log(`🚛 Trucks with live tracking: ${trucks.length}`);
    console.log(`📍 Route points per truck: ${routeCoordinates.length}`);
    console.log(`⏱️  Time span: ${routeCoordinates.length * timeInterval} seconds per truck`);
    
    // Generate summary report
    const summary = {
      trucks_count: trucks.length,
      route_points: routeCoordinates.length,
      total_records: totalInserted,
      time_interval_seconds: timeInterval,
      route_duration_minutes: (routeCoordinates.length * timeInterval) / 60,
      start_coordinate: routeCoordinates[0],
      end_coordinate: routeCoordinates[routeCoordinates.length - 1],
      trucks: trucks.map(t => ({
        id: t.id,
        number: t.truckNumber,
        name: t.name
      }))
    };
    
    console.log('\n📋 Generation Summary:');
    console.log(JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('❌ Error generating live tracking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fungsi untuk membersihkan data lama (optional)
async function cleanOldTrackingData(hoursOld = 24) {
  try {
    const cutoffTime = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));
    
    const result = await prisma.gpsPosition.deleteMany({
      where: {
        recorded_at: {
          lt: cutoffTime
        }
      }
    });
    
    console.log(`🧹 Cleaned ${result.count} old GPS records older than ${hoursOld} hours`);
  } catch (error) {
    console.error('❌ Error cleaning old data:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--clean')) {
    const hours = parseInt(args[args.indexOf('--clean') + 1]) || 24;
    await cleanOldTrackingData(hours);
  }
  
  if (args.includes('--generate') || args.length === 0) {
    await generateLiveTrackingData();
  }
  
  if (args.includes('--help')) {
    console.log(`
🚛 Live Tracking Route Generator

Usage:
  node generate-live-tracking-route.js [options]

Options:
  --generate          Generate live tracking data (default)
  --clean [hours]     Clean old GPS data (default: 24 hours)
  --help              Show this help message

Examples:
  node generate-live-tracking-route.js
  node generate-live-tracking-route.js --generate
  node generate-live-tracking-route.js --clean 48
  node generate-live-tracking-route.js --generate --clean 24
    `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateLiveTrackingData,
  cleanOldTrackingData,
  routeCoordinates
};
