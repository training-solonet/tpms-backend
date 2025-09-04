const { PrismaClient } = require('@prisma/client');

async function checkFunction() {
  const prisma = new PrismaClient();
  
  try {
    const result = await prisma.$queryRaw`
      SELECT proname FROM pg_proc WHERE proname = 'process_sensor_queue_batch'
    `;
    
    console.log('Function exists:', result.length > 0 ? 'YES' : 'NO');
    
    if (result.length === 0) {
      console.log('❌ Function process_sensor_queue_batch is missing from database');
      console.log('This is causing the server crash');
    } else {
      console.log('✅ Function exists in database');
    }
    
  } catch (error) {
    console.error('Error checking function:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFunction();
