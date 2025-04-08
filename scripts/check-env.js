require('dotenv').config();

console.log('Checking environment variables...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Found' : 'Not found');

// Try to connect to the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database!');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection(); 