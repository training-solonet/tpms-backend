const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test truckAlert table
    console.log('📊 Testing truckAlert table...');
    const alertCount = await prisma.truckAlert.count();
    console.log(`✅ Alert count: ${alertCount}`);
    
    // Test if table exists and has proper structure
    const sampleAlert = await prisma.truckAlert.findFirst();
    console.log('✅ Sample alert:', sampleAlert ? 'Found' : 'No alerts in database');
    
    // Test truck table
    console.log('📊 Testing truck table...');
    const truckCount = await prisma.truck.count();
    console.log(`✅ Truck count: ${truckCount}`);
    
    // Test users table
    console.log('📊 Testing users table...');
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

testDatabaseConnection();
