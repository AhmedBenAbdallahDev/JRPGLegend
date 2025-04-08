/**
 * Check Game Structure Script
 * 
 * This script directly checks the database structure for the Game table
 * to understand what fields actually exist.
 */

const { PrismaClient } = require('@prisma/client');

// Create Prisma client with direct connection string
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:Dca91CiyzGIu@ep-super-cloud-a21cq5g7-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
    },
  },
});

async function checkGameStructure() {
  console.log('Checking Game table structure in the database...');

  try {
    // Query the information schema to get table columns
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Game';
    `;

    console.log('Game table structure:');
    console.log(tableInfo);

    // Create the region field if it doesn't exist
    let needToAddRegion = true;
    
    for (const column of tableInfo) {
      if (column.column_name === 'region') {
        needToAddRegion = false;
        console.log('\nRegion field already exists in the database.');
        break;
      }
    }

    if (needToAddRegion) {
      console.log('\nRegion field does not exist. Adding it...');
      
      // Add the region column as nullable with no default
      await prisma.$executeRaw`
        ALTER TABLE "Game" ADD COLUMN "region" TEXT;
      `;
      
      console.log('Region field added successfully!');
    }
    
  } catch (error) {
    console.error('Error checking game structure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGameStructure()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 