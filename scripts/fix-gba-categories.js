/**
 * GBA Category Fix Script
 * 
 * This script fixes issues with duplicate Game Boy Advance categories in the database.
 * It performs the following actions:
 * 
 * 1. Finds the official GBA category with slug 'gba'
 * 2. Creates this category if it doesn't exist
 * 3. Finds any games with core 'gba' that aren't properly categorized and adds them
 * 4. Finds any duplicate GBA categories with different slugs/titles
 * 5. Moves games from duplicate categories to the official GBA category
 * 6. Deletes the empty duplicate categories
 * 
 * This ensures all GBA games are properly categorized for EmulatorJS compatibility.
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

async function fixGbaDuplicates() {
  console.log('Starting GBA category fix script with direct connection...');

  try {
    // Find the GBA category
    const gbaCategory = await prisma.category.findFirst({
      where: { slug: 'gba' },
    });

    if (!gbaCategory) {
      console.log('GBA category not found! Creating it...');
      const newCategory = await prisma.category.create({
        data: {
          title: 'Game Boy Advance',
          slug: 'gba'
        }
      });
      console.log(`Created new GBA category with ID: ${newCategory.id}`);
      return;
    }

    console.log(`Found GBA category: ID: ${gbaCategory.id}, Title: ${gbaCategory.title}, Slug: ${gbaCategory.slug}`);

    // Find games that should be in GBA category (core is 'gba')
    const gbaGames = await prisma.game.findMany({
      where: {
        core: 'gba',
        categories: {
          none: {
            id: gbaCategory.id
          }
        }
      },
      include: {
        categories: true
      }
    });

    console.log(`Found ${gbaGames.length} GBA games that are not in the GBA category:`);
    
    // Add these games to the GBA category
    for (const game of gbaGames) {
      console.log(`Adding game "${game.title}" to GBA category`);
      
      await prisma.game.update({
        where: { id: game.id },
        data: {
          categories: {
            connect: { id: gbaCategory.id }
          }
        }
      });
    }

    // Also check for any other categories with 'Game Boy Advance' in the name
    const otherGbaCategories = await prisma.category.findMany({
      where: {
        AND: [
          { id: { not: gbaCategory.id } },
          { 
            OR: [
              { title: { contains: 'Game Boy Advance', mode: 'insensitive' } },
              { title: { contains: 'GBA', mode: 'insensitive' } },
              { slug: { contains: 'gameboy-advance', mode: 'insensitive' } }
            ]
          }
        ]
      },
      include: {
        games: true
      }
    });

    console.log(`Found ${otherGbaCategories.length} other GBA-related categories`);
    
    // Process each category
    for (const category of otherGbaCategories) {
      console.log(`Processing category: ID: ${category.id}, Title: ${category.title}, Slug: ${category.slug}`);
      
      // Get games from this category
      const games = category.games;
      console.log(`Moving ${games.length} games to main GBA category`);
      
      // Move each game to the gbaCategory
      for (const game of games) {
        console.log(`Moving game: ${game.title}`);
        
        // Update the game's categories
        await prisma.game.update({
          where: { id: game.id },
          data: {
            categories: {
              disconnect: { id: category.id },
              connect: { id: gbaCategory.id }
            }
          }
        });
      }
      
      // Delete the now-empty category
      console.log(`Deleting empty category: ${category.title}`);
      await prisma.category.delete({
        where: { id: category.id }
      });
    }
    
    console.log('GBA categories and games fixed successfully!');
  } catch (error) {
    console.error('Error fixing GBA categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGbaDuplicates()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 