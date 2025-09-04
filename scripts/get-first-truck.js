const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getFirstTruck() {
  try {
    const truck = await prisma.truck.findFirst();
    console.log('First truck ID:', truck?.id);
    console.log('Plate number:', truck?.plateNumber);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

getFirstTruck();
