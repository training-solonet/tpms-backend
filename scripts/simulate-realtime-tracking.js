const { PrismaClient } = require('@prisma/client');
const WebSocket = require('ws');
require('dotenv').config();

const prisma = new PrismaClient();

// Import rute koordinat dari script sebelumnya
const { routeCoordinates } = require('./generate-live-tracking-route');

class RealtimeTrackingSimulator {
  constructor() {
    this.isRunning = false;
    this.trucks = [];
    this.currentPositions = new Map(); // truck_id -> current_index
    this.intervalId = null;
    this.websocket = null;
  }

  async initialize() {
    try {
      console.log('🚛 Initializing Realtime Tracking Simulator...');
      
      // Get active trucks
      this.trucks = await prisma.truck.findMany({
        where: { status: 'ACTIVE' },
        take: 5,
        select: {
          id: true,
          truckNumber: true,
          name: true,
          currentLatitude: true,
          currentLongitude: true
        }
      });

      if (this.trucks.length === 0) {
        console.log('❌ No active trucks found');
        return false;
      }

      // Initialize positions - each truck starts at different points
      this.trucks.forEach((truck, index) => {
        const startIndex = (index * Math.floor(routeCoordinates.length / this.trucks.length)) % routeCoordinates.length;
        this.currentPositions.set(truck.id, startIndex);
      });

      console.log(`📊 Initialized ${this.trucks.length} trucks for realtime simulation`);
      return true;
    } catch (error) {
      console.error('❌ Error initializing simulator:', error);
      return false;
    }
  }

  async connectWebSocket() {
    try {
      const wsUrl = process.env.WS_URL || 'ws://localhost:3001/ws';
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.on('open', () => {
        console.log('📡 Connected to WebSocket server');
      });
      
      this.websocket.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
      });
      
      this.websocket.on('close', () => {
        console.log('📡 WebSocket connection closed');
      });
    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
    }
  }

  calculateSpeed(lat1, lon1, lat2, lon2, timeIntervalSeconds) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const speedKmh = (distance / timeIntervalSeconds) * 3600;
    return Math.max(0, Math.min(speedKmh, 80));
  }

  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  async updateTruckPosition(truck) {
    try {
      const currentIndex = this.currentPositions.get(truck.id);
      const nextIndex = (currentIndex + 1) % routeCoordinates.length;
      
      const [currentLat, currentLon] = routeCoordinates[currentIndex];
      const [nextLat, nextLon] = routeCoordinates[nextIndex];
      
      // Calculate movement data
      const speed = this.calculateSpeed(currentLat, currentLon, nextLat, nextLon, 30);
      const heading = this.calculateBearing(currentLat, currentLon, nextLat, nextLon);
      
      // Generate realistic sensor data
      const sensorData = {
        device_id: `DEVICE_${truck.truckNumber.replace(/\s+/g, '_')}`,
        truck_id: truck.id,
        latitude: nextLat,
        longitude: nextLon,
        altitude: Math.random() * 20 + 120,
        speed: speed + (Math.random() * 10 - 5), // Add some variance
        heading: heading + (Math.random() * 20 - 10), // Add some variance
        satellites: Math.floor(Math.random() * 4) + 9,
        hdop: Math.random() * 1.5 + 1,
        recorded_at: new Date(),
        received_at: new Date(),
        
        // Mining truck specific data
        fuel_level: Math.max(20, Math.min(100, (truck.fuel_level || 75) + (Math.random() * 2 - 1))),
        engine_temp: Math.random() * 15 + 85,
        engine_rpm: speed > 5 ? Math.random() * 800 + 1400 : Math.random() * 200 + 800,
        payload_weight: Math.random() * 30 + 160,
        tire_pressure_fl: Math.random() * 15 + 85,
        tire_pressure_fr: Math.random() * 15 + 85,
        tire_pressure_rl: Math.random() * 15 + 85,
        tire_pressure_rr: Math.random() * 15 + 85,
        
        is_moving: speed > 3,
        is_idle: speed < 1,
        engine_status: speed > 0 ? 'running' : 'idle',
        driver_id: `DRIVER_${Math.floor(Math.random() * 50) + 1}`,
        geofence_status: 'inside_mining_area',
        zone_id: 'ZONE_MINING_001'
      };

      // Insert GPS position
      await prisma.gpsPosition.create({
        data: sensorData
      });

      // Update truck current position
      await prisma.truck.update({
        where: { id: truck.id },
        data: {
          currentLatitude: nextLat,
          currentLongitude: nextLon,
          lastSeen: new Date(),
          updatedAt: new Date()
        }
      });

      // Update position index
      this.currentPositions.set(truck.id, nextIndex);

      // Broadcast via WebSocket if connected
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const wsMessage = {
          type: 'truck_location_update',
          data: {
            truckId: truck.id,
            truckNumber: truck.truckNumber,
            latitude: nextLat,
            longitude: nextLon,
            speed: speed,
            heading: heading,
            timestamp: new Date().toISOString()
          }
        };
        
        this.websocket.send(JSON.stringify(wsMessage));
      }

      return {
        truckNumber: truck.truckNumber,
        position: [nextLat, nextLon],
        speed: speed.toFixed(1),
        heading: heading.toFixed(0)
      };

    } catch (error) {
      console.error(`❌ Error updating position for ${truck.truckNumber}:`, error.message);
      return null;
    }
  }

  async startSimulation(intervalSeconds = 30) {
    if (this.isRunning) {
      console.log('⚠️  Simulation already running');
      return;
    }

    const initialized = await this.initialize();
    if (!initialized) return;

    await this.connectWebSocket();

    this.isRunning = true;
    console.log(`🚀 Starting realtime tracking simulation (${intervalSeconds}s interval)`);
    console.log(`🚛 Tracking ${this.trucks.length} trucks along ${routeCoordinates.length} route points`);

    this.intervalId = setInterval(async () => {
      try {
        const updates = [];
        
        for (const truck of this.trucks) {
          const update = await this.updateTruckPosition(truck);
          if (update) {
            updates.push(update);
          }
        }

        if (updates.length > 0) {
          console.log(`📍 Updated positions for ${updates.length} trucks:`);
          updates.forEach(update => {
            console.log(`   ${update.truckNumber}: [${update.position[0].toFixed(6)}, ${update.position[1].toFixed(6)}] - ${update.speed} km/h, ${update.heading}°`);
          });
        }

      } catch (error) {
        console.error('❌ Error in simulation loop:', error);
      }
    }, intervalSeconds * 1000);

    console.log('✅ Realtime tracking simulation started');
    console.log('   Press Ctrl+C to stop simulation');
  }

  stopSimulation() {
    if (!this.isRunning) {
      console.log('⚠️  Simulation not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.isRunning = false;
    console.log('🛑 Realtime tracking simulation stopped');
  }

  async getSimulationStatus() {
    try {
      const activeCount = await prisma.truck.count({
        where: { status: 'ACTIVE' }
      });

      const recentGpsCount = await prisma.gpsPosition.count({
        where: {
          recorded_at: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        }
      });

      return {
        isRunning: this.isRunning,
        activeTrucks: activeCount,
        trackedTrucks: this.trucks.length,
        routePoints: routeCoordinates.length,
        recentGpsRecords: recentGpsCount,
        currentPositions: Object.fromEntries(this.currentPositions)
      };
    } catch (error) {
      console.error('❌ Error getting simulation status:', error);
      return null;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const simulator = new RealtimeTrackingSimulator();

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping simulation...');
    simulator.stopSimulation();
    process.exit(0);
  });

  if (args.includes('--start')) {
    const intervalIndex = args.indexOf('--interval');
    const interval = intervalIndex !== -1 ? parseInt(args[intervalIndex + 1]) || 30 : 30;
    await simulator.startSimulation(interval);
  } else if (args.includes('--status')) {
    const status = await simulator.getSimulationStatus();
    console.log('📊 Simulation Status:');
    console.log(JSON.stringify(status, null, 2));
    process.exit(0);
  } else if (args.includes('--help')) {
    console.log(`
🚛 Realtime Tracking Simulator

Usage:
  node simulate-realtime-tracking.js [options]

Options:
  --start                 Start realtime simulation
  --interval [seconds]    Update interval (default: 30 seconds)
  --status               Show simulation status
  --help                 Show this help message

Examples:
  node simulate-realtime-tracking.js --start
  node simulate-realtime-tracking.js --start --interval 15
  node simulate-realtime-tracking.js --status
    `);
    process.exit(0);
  } else {
    console.log('Use --help for usage information');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RealtimeTrackingSimulator;
