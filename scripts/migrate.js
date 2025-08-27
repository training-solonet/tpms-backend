const { Pool } = require('pg');
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

// Database connection using pg (fallback)
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fleet_management',
  password: process.env.DB_PASSWORD || 'truk1234',
  port: process.env.DB_PORT || 5432,
});

// Test results storage
const migrationReport = {
  status: 'PENDING',
  startTime: new Date(),
  endTime: null,
  errors: [],
  validations: [],
  warnings: []
};

const testPrismaConnection = async () => {
  log('🔌 Testing Prisma connection...', 'yellow');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test basic connection
    await prisma.$connect();
    log('  ✅ Prisma client connected successfully', 'green');
    
    // Test a simple query with error handling
    try {
      const userCount = await prisma.user.count();
      log(`  ✅ Prisma query test passed (${userCount} users found)`, 'green');
    } catch (queryError) {
      log(`  ⚠️ Prisma query test failed: ${queryError.message}`, 'yellow');
      migrationReport.warnings.push(`Prisma query issue: ${queryError.message}`);
      
      // Try alternative query
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
        log('  ✅ Prisma raw query works', 'green');
      } catch (rawError) {
        log(`  ❌ Prisma raw query also failed: ${rawError.message}`, 'red');
        migrationReport.errors.push(`Prisma raw query error: ${rawError.message}`);
      }
    }
    
    await prisma.$disconnect();
    migrationReport.validations.push('Prisma connection test');
    return true;
  } catch (error) {
    log(`  ❌ Prisma connection failed: ${error.message}`, 'red');
    migrationReport.errors.push(`Prisma connection error: ${error.message}`);
    return false;
  }
};

const validateDatabaseSchema = async (client) => {
  log('🔍 Validating database schema...', 'yellow');
  
  const requiredTables = [
    'users', 'truck_models', 'trucks', 'tire_pressures', 
    'truck_alerts', 'location_history', 'mining_zones'
  ];
  
  for (const table of requiredTables) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        log(`  ✅ Table ${table} exists`, 'green');
        migrationReport.validations.push(`Schema validation - ${table} table exists`);
      } else {
        throw new Error(`Table ${table} does not exist`);
      }
    } catch (error) {
      migrationReport.errors.push(`Schema validation error: ${error.message}`);
      throw error;
    }
  }
  
  // Check PostGIS extension
  try {
    await client.query(`SELECT PostGIS_Version()`);
    log('  ✅ PostGIS extension is available', 'green');
    migrationReport.validations.push('PostGIS extension check');
  } catch (error) {
    log('  ⚠️ PostGIS extension not available - spatial features may not work', 'yellow');
    migrationReport.warnings.push('PostGIS extension not available');
  }
};

const validateDataIntegrity = async (client) => {
  log('🔎 Checking data integrity...', 'yellow');
  
  try {
    // Check for trucks with coordinates
    const trucksWithCoords = await client.query(`
      SELECT COUNT(*) as count 
      FROM trucks 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);
    
    log(`  ✅ Found ${trucksWithCoords.rows[0].count} trucks with coordinates`, 'green');
    
    // Check for tire pressure data
    const tireData = await client.query(`
      SELECT COUNT(*) as count, COUNT(DISTINCT truck_id) as unique_trucks
      FROM tire_pressures
    `);
    
    log(`  ✅ Found tire pressure data for ${tireData.rows[0].unique_trucks} trucks (${tireData.rows[0].count} total readings)`, 'green');
    
    migrationReport.validations.push('Data integrity check');
  } catch (error) {
    migrationReport.errors.push(`Data integrity error: ${error.message}`);
    throw error;
  }
};

const testCriticalQueries = async (client) => {
  log('🧪 Testing critical queries...', 'yellow');
  
  const criticalQueries = [
    {
      name: 'Get all trucks with details',
      query: `
        SELECT t.*, tm.name as model_name, tm.manufacturer 
        FROM trucks t 
        LEFT JOIN truck_models tm ON t.model_id = tm.id 
        LIMIT 1
      `
    },
    {
      name: 'Get truck locations for map',
      query: `
        SELECT id, truck_number, latitude, longitude, status, fuel_percentage 
        FROM trucks 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
        LIMIT 5
      `
    },
    {
      name: 'Get tire pressure summary',
      query: `
        SELECT truck_id, AVG(pressure_psi) as avg_pressure, COUNT(*) as tire_count
        FROM tire_pressures 
        GROUP BY truck_id 
        LIMIT 3
      `
    },
    {
      name: 'Get active alerts',
      query: `
        SELECT COUNT(*) as alert_count 
        FROM truck_alerts 
        WHERE is_resolved = false
      `
    }
  ];
  
  for (const test of criticalQueries) {
    try {
      const result = await client.query(test.query);
      log(`  ✅ ${test.name}: ${result.rows.length} rows returned`, 'green');
    } catch (error) {
      log(`  ❌ ${test.name}: ${error.message}`, 'red');
      migrationReport.errors.push(`Query test failed - ${test.name}: ${error.message}`);
    }
  }
  
  migrationReport.validations.push('Critical queries test');
};

const performanceComparison = async (client) => {
  log('⚡ Running performance comparison...', 'yellow');
  
  try {
    const startTime = Date.now();
    
    await client.query(`
      SELECT t.id, t.truck_number, t.status, t.latitude, t.longitude, 
             tm.name as model_name, 
             (SELECT COUNT(*) FROM truck_alerts ta WHERE ta.truck_id = t.id AND ta.is_resolved = false) as active_alerts
      FROM trucks t
      LEFT JOIN truck_models tm ON t.model_id = tm.id
      ORDER BY t.updated_at DESC
      LIMIT 50
    `);
    
    const endTime = Date.now();
    const queryTime = endTime - startTime;
    
    log(`  ✅ Complex query executed in ${queryTime}ms`, 'green');
    
    if (queryTime > 1000) {
      migrationReport.warnings.push(`Query performance concern: ${queryTime}ms (consider adding indexes)`);
    }
    
    migrationReport.validations.push('Performance comparison');
  } catch (error) {
    migrationReport.errors.push(`Performance test error: ${error.message}`);
  }
};

const createOptimalIndexes = async (client) => {
  log('📊 Creating optimal indexes...', 'yellow');
  
  const indexes = [
    {
      name: 'idx_trucks_status_updated',
      query: 'CREATE INDEX IF NOT EXISTS idx_trucks_status_updated ON trucks (status, updated_at DESC)'
    },
    {
      name: 'idx_trucks_coords',
      query: 'CREATE INDEX IF NOT EXISTS idx_trucks_coords ON trucks (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL'
    },
    {
      name: 'idx_tire_pressures_truck_status',
      query: 'CREATE INDEX IF NOT EXISTS idx_tire_pressures_truck_status ON tire_pressures (truck_id, status, recorded_at DESC)'
    },
    {
      name: 'idx_truck_alerts_unresolved',
      query: 'CREATE INDEX IF NOT EXISTS idx_truck_alerts_unresolved ON truck_alerts (truck_id, is_resolved, created_at DESC) WHERE is_resolved = false'
    },
    {
      name: 'idx_location_history_recent',
      query: 'CREATE INDEX IF NOT EXISTS idx_location_history_recent ON location_history (truck_id, recorded_at DESC)'
    }
  ];
  
  for (const index of indexes) {
    try {
      await client.query(index.query);
      log(`  ✅ Created index: ${index.name}`, 'green');
    } catch (error) {
      log(`  ℹ️ Index ${index.name}: ${error.message}`, 'cyan');
    }
  }
  
  migrationReport.validations.push('Index creation');
};

// Main migration function
const runMigration = async () => {
  let client;
  let prismaWorking = false;
  
  try {
    log('🚀 Starting migration process...', 'blue');
    log('='.repeat(50), 'blue');
    
    // Step 1: Validate database schema
    client = await pool.connect();
    await validateDatabaseSchema(client);
    
    // Step 2: Test Prisma connection
    prismaWorking = await testPrismaConnection();
    
    // Step 3: Validate data integrity
    await validateDataIntegrity(client);
    
    // Step 4: Test critical queries
    await testCriticalQueries(client);
    
    // Step 5: Performance comparison
    await performanceComparison(client);
    
    // Step 6: Create optimal indexes
    await createOptimalIndexes(client);
    
    // Update migration report
    migrationReport.status = 'COMPLETED';
    migrationReport.endTime = new Date();
    
    log('', '');
    log('='.repeat(50), 'blue');
    log('🎉 MIGRATION COMPLETED SUCCESSFULLY!', 'green');
    log('='.repeat(50), 'blue');
    
  } catch (error) {
    migrationReport.status = 'FAILED';
    migrationReport.endTime = new Date();
    migrationReport.errors.push(error.message);
    
    log('💥 Migration failed:', 'red');
    log(error.message, 'red');
    
    // If Prisma fails but database works, suggest alternative
    if (!prismaWorking && client) {
      log('', '');
      log('🔄 ALTERNATIVE APPROACH:', 'yellow');
      log('Since Prisma is having issues, you can still use the database directly:', 'yellow');
      log('1. Run: npm run setup:db (if not already done)', 'cyan');
      log('2. Run: npm run dev', 'cyan');
      log('3. Your API will work with direct database queries', 'cyan');
    }
    
  } finally {
    if (client) client.release();
    await pool.end();
    
    // Print migration report
    printMigrationReport();
  }
};

const printMigrationReport = () => {
  log('', '');
  log('📋 MIGRATION REPORT', 'blue');
  log('='.repeat(20), 'blue');
  log(`Status: ${migrationReport.status}`, migrationReport.status === 'COMPLETED' ? 'green' : 'red');
  log(`Duration: ${Math.round((migrationReport.endTime - migrationReport.startTime) / 1000)}s`, 'cyan');
  log(`Timestamp: ${migrationReport.endTime.toISOString()}`, 'cyan');
  
  if (migrationReport.errors.length > 0) {
    log('❌ ERRORS:', 'red');
    migrationReport.errors.forEach(error => {
      log(`  - ${error}`, 'red');
    });
  }
  
  if (migrationReport.warnings.length > 0) {
    log('⚠️ WARNINGS:', 'yellow');
    migrationReport.warnings.forEach(warning => {
      log(`  - ${warning}`, 'yellow');
    });
  }
  
  if (migrationReport.validations.length > 0) {
    log('✅ VALIDATIONS COMPLETED:', 'green');
    migrationReport.validations.forEach(validation => {
      log(`  - ${validation}`, 'green');
    });
  }
  
  log('', '');
  if (migrationReport.status === 'COMPLETED') {
    log('🚀 Your backend is ready! You can now start the server with: npm run dev', 'green');
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = {
  runMigration,
  validateDatabaseSchema,
  testPrismaConnection
};