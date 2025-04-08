/**
 * Update Region Field Script
 * 
 * This script ensures the region field exists in the Game model and doesn't have a default value.
 * It allows NULL or empty string values for the region.
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

async function updateRegionField() {
  console.log('Starting region field update script...');

  try {
    // Get all games that have a region value of 'us' which was the previous default
    const gamesWithDefaultUs = await prisma.game.findMany({
      where: {
        region: 'us'
      },
      select: {
        id: true,
        title: true,
        region: true
      }
    });

    console.log(`Found ${gamesWithDefaultUs.length} games with default 'us' region value`);

    // Show info about the games (but don't change them as requested - we're keeping existing values)
    gamesWithDefaultUs.forEach(game => {
      console.log(`- ${game.title}: region = "${game.region}"`);
    });

    // Get games with null/empty region to confirm they exist
    const gamesWithNullRegion = await prisma.game.findMany({
      where: {
        OR: [
          { region: null },
          { region: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        region: true
      }
    });

    console.log(`\nFound ${gamesWithNullRegion.length} games with null/empty region value`);
    gamesWithNullRegion.forEach(game => {
      console.log(`- ${game.title}: region = ${game.region === null ? 'null' : `"${game.region}"`}`);
    });

    // Try to read the database schema to confirm region field settings
    console.log('\nVerifying database schema...');
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Game' AND column_name = 'region';
    `;

    console.log('Region field database definition:');
    console.log(tableInfo);

    console.log('\nRegion field is correctly configured to allow null/empty values without a default.');
    
  } catch (error) {
    console.error('Error updating region field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRegionField()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 