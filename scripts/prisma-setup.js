// prisma-setup.js - Complete Prisma migration and setup script
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

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

// Initialize Prisma client
let prisma;

const initializePrisma = () => {
  try {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:truk1234@localhost:5432/fleet_management?schema=public'
        }
      }
    });
    return true;
  } catch (error) {
    log(`❌ Failed to initialize Prisma: ${error.message}`, 'red');
    return false;
  }
};

// Step 1: Setup Prisma migration files
const setupMigrationFiles = async () => {
  log('📁 Setting up Prisma migration files...', 'yellow');
  
  try {
    // Create prisma directory structure
    const prismaDir = path.join(process.cwd(), 'prisma');
    const migrationsDir = path.join(prismaDir, 'migrations');
    const migrationDir = path.join(migrationsDir, '20241201000000_init');
    
    await fs.mkdir(prismaDir, { recursive: true });
    await fs.mkdir(migrationsDir, { recursive: true });
    await fs.mkdir(migrationDir, { recursive: true });
    
    // Write the migration SQL file
    const migrationSQL = await fs.readFile(path.join(__dirname, 'prisma_migration.sql'), 'utf8');
    await fs.writeFile(path.join(migrationDir, 'migration.sql'), migrationSQL);
    
    log('  ✅ Migration files created successfully', 'green');
    return true;
  } catch (error) {
    log(`  ❌ Failed to create migration files: ${error.message}`, 'red');
    return false;
  }
};

// Step 2: Generate Prisma client
const generatePrismaClient = async () => {
  log('🔧 Generating Prisma client...', 'yellow');
  
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log('  ✅ Prisma client generated successfully', 'green');
    return true;
  } catch (error) {
    log(`  ❌ Failed to generate Prisma client: ${error.message}`, 'red');
    
    // Try alternative approach
    try {
      log('  🔄 Trying alternative generation method...', 'yellow');
      execSync('npm run prisma:generate', { stdio: 'inherit' });
      log('  ✅ Prisma client generated via npm script', 'green');
      return true;
    } catch (altError) {
      log(`  ❌ Alternative method also failed: ${altError.message}`, 'red');
      return false;
    }
  }
};

// Step 3: Apply database migrations
const applyMigrations = async () => {
  log('🗄️ Applying database migrations...', 'yellow');
  
  try {
    // First try to deploy existing migrations
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log('  ✅ Database migrations applied successfully', 'green');
    return true;
  } catch (error) {
    log(`  ⚠️ Migration deploy failed, trying reset: ${error.message}`, 'yellow');
    
    try {
      // If deploy fails, try migrate reset
      execSync('npx prisma migrate reset --force', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      log('  ✅ Database reset and migrated successfully', 'green');
      return true;
    } catch (resetError) {
      log(`  ❌ Migration reset also failed: ${resetError.message}`, 'red');
      return false;
    }
  }
};

// Step 4: Seed initial data
const seedInitialData = async () => {
  log('🌱 Seeding initial truck data...', 'yellow');
  
  if (!prisma) {
    log('  ❌ Prisma client not initialized', 'red');
    return false;
  }
  
  try {
    // Check if trucks already exist
    const existingTrucks = await prisma.truck.count();
    
    if (existingTrucks > 0) {
      log(`  ℹ️ Found ${existingTrucks} existing trucks, skipping seed`, 'cyan');
      return true;
    }
    
    // Get truck models
    const truckModels = await prisma.truckModel.findMany();
    
    if (truckModels.length === 0) {
      log('  ❌ No truck models found. Database may not be properly initialized.', 'red');
      return false;
    }
    
    log(`  📦 Found ${truckModels.length} truck models, creating trucks...`, 'cyan');
    
    // PT INDOBARA coordinates
    const bounds = {
      minLat: -3.717200000114277,
      maxLat: -3.431898966201222,
      minLng: 115.432199323066001,
      maxLng: 115.658299919322602
    };
    
    // Create trucks in batches
    const totalTrucks = 1000;
    const batchSize = 50;
    const totalBatches = Math.ceil(totalTrucks / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const trucksInBatch = Math.min(batchSize, totalTrucks - (batch * batchSize));
      const trucksData = [];
      
      for (let i = 0; i < trucksInBatch; i++) {
        const truckIndex = (batch * batchSize) + i + 1;
        const randomModel = truckModels[Math.floor(Math.random() * truckModels.length)];
        
        // Random status with realistic distribution
        let status = 'active';
        const rand = Math.random();
        if (rand < 0.1) status = 'maintenance';
        else if (rand < 0.25) status = 'inactive';
        
        // Random coordinates within PT INDOBARA
        const latitude = parseFloat((bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat)).toFixed(8));
        const longitude = parseFloat((bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng)).toFixed(8));
        
        trucksData.push({
          truckNumber: `T${String(truckIndex).padStart(4, '0')}`,
          modelId: randomModel.id,
          status: status,
          latitude: latitude,
          longitude: longitude,
          speed: status === 'active' ? parseFloat((Math.random() * 60).toFixed(2)) : 0,
          heading: Math.floor(Math.random() * 360),
          fuelPercentage: parseFloat((20 + Math.random() * 80).toFixed(2)),
          payloadTons: status === 'active' ? parseFloat((Math.random() * randomModel.capacityTons).toFixed(2)) : 0,
          driverName: status === 'active' ? `Driver ${truckIndex}` : null,
          engineHours: Math.floor(Math.random() * 10000),
          odometer: Math.floor(Math.random() * 100000),
          lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
        });
      }
      
      await prisma.truck.createMany({
        data: trucksData,
        skipDuplicates: true
      });
      
      log(`  ✅ Batch ${batch + 1}/${totalBatches}: Created ${trucksInBatch} trucks`, 'green');
    }
    
    const finalCount = await prisma.truck.count();
    log(`  🎉 Successfully created ${finalCount} trucks total`, 'green');
    
    return true;
  } catch (error) {
    log(`  ❌ Failed to seed initial data: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
};

// Step 5: Setup tire pressure data
const seedTirePressureData = async () => {
  log('🔧 Setting up tire pressure data...', 'yellow');
  
  try {
    const trucks = await prisma.truck.findMany({
      take: 100, // Process first 100 trucks for initial setup
    });
    
    const tirePositions = ['front_left', 'front_right', 'middle_left', 'middle_right', 'rear_left', 'rear_right'];
    
    for (const truck of trucks) {
      const tireData = [];
      
      for (let tireNum = 1; tireNum <= 6; tireNum++) {
        const pressure = parseFloat((80 + Math.random() * 40).toFixed(1));
        let status = 'normal';
        if (pressure < 85) status = 'low';
        else if (pressure > 115) status = 'high';
        
        tireData.push({
          truckId: truck.id,
          tirePosition: tirePositions[tireNum - 1],
          tireNumber: tireNum,
          pressurePsi: pressure,
          status: status,
          temperature: parseFloat((60 + Math.random() * 40).toFixed(2))
        });
      }
      
      await prisma.tirePressure.createMany({
        data: tireData,
        skipDuplicates: true
      });
    }
    
    log(`  ✅ Created tire pressure data for ${trucks.length} trucks`, 'green');
    return true;
  } catch (error) {
    log(`  ❌ Failed to seed tire pressure data: ${error.message}`, 'red');
    return false;
  }
};

// Step 6: Create sample alerts
const seedSampleAlerts = async () => {
  log('🚨 Creating sample alerts...', 'yellow');
  
  try {
    const trucks = await prisma.truck.findMany({
      where: { status: 'active' },
      take: 50 // Create alerts for 50 active trucks
    });
    
    const alertTypes = [
      'Low Fuel Warning',
      'Engine Temperature High', 
      'Tire Pressure Alert',
      'Scheduled Maintenance Due',
      'GPS Signal Lost',
      'Overload Warning'
    ];
    
    const severities = ['low', 'medium', 'high', 'critical'];
    
    for (const truck of trucks) {
      if (Math.random() < 0.6) { // 60% chance of having alerts
        const alertCount = 1 + Math.floor(Math.random() * 3); // 1-3 alerts per truck
        const alertData = [];
        
        for (let i = 0; i < alertCount; i++) {
          const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
          const severity = severities[Math.floor(Math.random() * severities.length)];
          const isResolved = Math.random() < 0.4; // 40% resolved
          
          alertData.push({
            truckId: truck.id,
            alertType: alertType,
            severity: severity,
            message: `${alertType} detected on truck ${truck.truckNumber}`,
            isResolved: isResolved,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
            resolvedAt: isResolved ? new Date() : null
          });
        }
        
        await prisma.truckAlert.createMany({
          data: alertData,
          skipDuplicates: true
        });
      }
    }
    
    const alertCount = await prisma.truckAlert.count();
    log(`  ✅ Created ${alertCount} sample alerts`, 'green');
    
    return true;
  } catch (error) {
    log(`  ❌ Failed to seed sample alerts: ${error.message}`, 'red');
    return false;
  }
};

// Main setup function
const setupPrismaFleetManagement = async () => {
  log('🚀 Starting Complete Prisma Fleet Management Setup', 'blue');
  log('=' * 60, 'blue');
  
  const startTime = Date.now();
  const results = {
    migrationFiles: false,
    clientGeneration: false, 
    migrations: false,
    initialData: false,
    tirePressure: false,
    alerts: false
  };
  
  try {
    // Step 1: Setup migration files
    results.migrationFiles = await setupMigrationFiles();
    
    // Step 2: Generate Prisma client
    results.clientGeneration = await generatePrismaClient();
    
    if (results.clientGeneration) {
      // Initialize Prisma after client generation
      if (initializePrisma()) {
        // Step 3: Apply migrations
        results.migrations = await applyMigrations();
        
        if (results.migrations) {
          // Step 4: Seed initial data
          results.initialData = await seedInitialData();
          
          // Step 5: Setup tire pressure data
          results.tirePressure = await seedTirePressureData();
          
          // Step 6: Create sample alerts
          results.alerts = await seedSampleAlerts();
        }
      }
    }
    
    // Generate final report
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    log('', '');
    log('=' * 60, 'blue');
    log('📊 SETUP COMPLETION REPORT', 'blue');
    log('=' * 60, 'blue');
    
    log(`⏱️ Total Duration: ${duration.toFixed(2)}s`, 'cyan');
    
    Object.entries(results).forEach(([step, success]) => {
      const status = success ? '✅ SUCCESS' : '❌ FAILED';
      const color = success ? 'green' : 'red';
      log(`${status} - ${step.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`, color);
    });
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalSteps = Object.keys(results).length;
    
    log('', '');
    if (successCount === totalSteps) {
      log('🎉 ALL SETUP STEPS COMPLETED SUCCESSFULLY!', 'green');
      log('', '');
      log('🚀 Your Prisma Fleet Management system is ready!', 'green');
      log('', '');
      log('📝 Next steps:', 'cyan');
      log('  1. Run: npm run dev (to start your server)', 'white');
      log('  2. Run: npm run seed:history (to add historical data)', 'white');
      log('  3. Open your application and check the dashboard', 'white');
    } else {
      log(`⚠️ PARTIAL SUCCESS: ${successCount}/${totalSteps} steps completed`, 'yellow');
      log('', '');
      log('💡 You can still proceed with manual database setup if needed', 'cyan');
    }
    
    // Show database statistics if possible
    if (prisma && results.initialData) {
      try {
        const stats = await prisma.$queryRaw`
          SELECT 
            (SELECT COUNT(*) FROM trucks) as trucks,
            (SELECT COUNT(*) FROM truck_models) as models,
            (SELECT COUNT(*) FROM tire_pressures) as tire_readings,
            (SELECT COUNT(*) FROM truck_alerts) as alerts,
            (SELECT COUNT(*) FROM trucks WHERE status = 'active') as active_trucks
        `;
        
        log('', '');
        log('📈 Database Statistics:', 'cyan');
        log(`   🚛 Trucks: ${stats[0].trucks}`, 'white');
        log(`   📋 Models: ${stats[0].models}`, 'white'); 
        log(`   🔧 Tire Readings: ${stats[0].tire_readings}`, 'white');
        log(`   🚨 Alerts: ${stats[0].alerts}`, 'white');
        log(`   ✅ Active Trucks: ${stats[0].active_trucks}`, 'white');
      } catch (error) {
        log('📊 Could not retrieve database statistics', 'yellow');
      }
    }
    
  } catch (error) {
    log(`💥 Setup failed with error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
};

// Package.json script helpers
const packageJsonScripts = {
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate deploy",
  "prisma:reset": "prisma migrate reset --force", 
  "prisma:studio": "prisma studio",
  "db:seed": "node prisma-setup.js",
  "seed:history": "node history-seeder.js",
  "setup:complete": "npm run db:seed && npm run seed:history"
};

log('📦 Recommended package.json scripts:', 'cyan');
Object.entries(packageJsonScripts).forEach(([script, command]) => {
  log(`  "${script}": "${command}"`, 'white');
});

// Export for use as module
module.exports = {
  setupPrismaFleetManagement,
  seedInitialData,
  seedTirePressureData,
  seedSampleAlerts,
  initializePrisma
};

// Run if called directly
if (require.main === module) {
  setupPrismaFleetManagement()
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}