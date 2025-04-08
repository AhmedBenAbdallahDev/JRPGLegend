/**
 * Fix SNES Duplicate Category Script
 * 
 * This script specifically fixes the issue where there's a duplicate SNES category
 * with uppercase slug "SNES" in addition to the official lowercase "snes" category.
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

async function fixSnesDuplicate() {
  console.log('Starting fix for duplicate SNES category...');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connection successful!');

    // Find the official lowercase "snes" category
    const officialSnesCategory = await prisma.category.findFirst({
      where: { slug: 'snes' },
      include: { games: true }
    });

    if (!officialSnesCategory) {
      console.log('No official SNES category found with slug "snes"');
      return;
    }

    console.log(`Found official SNES category:`);
    console.log(`ID: ${officialSnesCategory.id}`);
    console.log(`Title: ${officialSnesCategory.title}`);
    console.log(`Slug: ${officialSnesCategory.slug}`);
    console.log(`Games: ${officialSnesCategory.games.length}`);

    // Find the uppercase "SNES" category
    const uppercaseSnesCategory = await prisma.category.findFirst({
      where: { 
        slug: { equals: 'SNES', mode: 'default' } // Case-sensitive match
      },
      include: { games: true }
    });

    if (!uppercaseSnesCategory) {
      console.log('No duplicate SNES category found with uppercase slug "SNES"');
      return;
    }

    console.log(`\nFound duplicate SNES category:`);
    console.log(`ID: ${uppercaseSnesCategory.id}`);
    console.log(`Title: ${uppercaseSnesCategory.title}`);
    console.log(`Slug: ${uppercaseSnesCategory.slug}`);
    console.log(`Games: ${uppercaseSnesCategory.games.length}`);

    // Move all games from the duplicate to the official category
    console.log(`\nMoving ${uppercaseSnesCategory.games.length} games to the official SNES category...`);
    
    for (const game of uppercaseSnesCategory.games) {
      // Check if the game is already in the official category
      const isAlreadyInOfficial = officialSnesCategory.games.some(g => g.id === game.id);
      
      if (!isAlreadyInOfficial) {
        console.log(`Moving game "${game.title}" to the official SNES category`);
        
        await prisma.game.update({
          where: { id: game.id },
          data: {
            categories: {
              connect: { id: officialSnesCategory.id },
              disconnect: { id: uppercaseSnesCategory.id }
            }
          }
        });
      } else {
        console.log(`Game "${game.title}" is already in the official SNES category, just removing from duplicate`);
        
        await prisma.game.update({
          where: { id: game.id },
          data: {
            categories: {
              disconnect: { id: uppercaseSnesCategory.id }
            }
          }
        });
      }
    }

    // Delete the duplicate category
    console.log(`\nDeleting the duplicate SNES category (ID: ${uppercaseSnesCategory.id})...`);
    
    await prisma.category.delete({
      where: { id: uppercaseSnesCategory.id }
    });

    console.log('\nDuplicate SNES category has been successfully fixed!');

  } catch (error) {
    console.error('Error fixing SNES duplicate:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixSnesDuplicate()
  .then(() => {
    console.log("\nScript completed successfully.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  }); 