/**
 * Fix Game Boy Categories Script
 * 
 * This script correctly separates the Game Boy, Game Boy Color, and Game Boy Advance categories,
 * which need to be distinct for EmulatorJS compatibility.
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

// Define the three Game Boy platforms
const platforms = [
  {
    slug: 'gb',
    title: 'Game Boy',
    core: 'gb' 
  },
  {
    slug: 'gbc',
    title: 'Game Boy Color',
    core: 'gbc'
  },
  {
    slug: 'gba',
    title: 'Game Boy Advance',
    core: 'gba'
  }
];

async function fixGameBoyCategories() {
  console.log('Starting Game Boy categories fix script...');

  try {
    // For each platform, ensure it has the correct category and games
    for (const platform of platforms) {
      console.log(`\n=== Processing ${platform.title} ===`);
      
      // Find or create the category
      let category = await prisma.category.findFirst({
        where: { slug: platform.slug },
      });
      
      if (!category) {
        console.log(`${platform.title} category not found! Creating it...`);
        category = await prisma.category.create({
          data: {
            title: platform.title,
            slug: platform.slug
          }
        });
        console.log(`Created new ${platform.title} category with ID: ${category.id}`);
      } else {
        console.log(`Found ${platform.title} category: ID: ${category.id}, Slug: ${category.slug}`);
      }
      
      // Find games with the matching core that should be in this category
      const gamesToFix = await prisma.game.findMany({
        where: {
          core: platform.core
        },
        include: {
          categories: true
        }
      });
      
      console.log(`Found ${gamesToFix.length} ${platform.title} games`);
      
      // For each game, ensure it's in the correct category
      for (const game of gamesToFix) {
        const isInCorrectCategory = game.categories.some(cat => cat.id === category.id);
        
        if (!isInCorrectCategory) {
          console.log(`Moving game "${game.title}" to ${platform.title} category`);
          
          // Update categories (don't disconnect from other categories, just add this one)
          await prisma.game.update({
            where: { id: game.id },
            data: {
              categories: {
                connect: { id: category.id }
              }
            }
          });
        } else {
          console.log(`Game "${game.title}" already in correct category`);
        }
      }
      
      // Now, find games in this category that SHOULDN'T be there (have a different core)
      const misplacedGames = await prisma.game.findMany({
        where: {
          core: { not: platform.core },
          categories: {
            some: {
              id: category.id
            }
          }
        },
        include: {
          categories: true
        }
      });
      
      console.log(`Found ${misplacedGames.length} games incorrectly in the ${platform.title} category`);
      
      // Remove these games from the category
      for (const game of misplacedGames) {
        console.log(`Removing game "${game.title}" (core: ${game.core}) from ${platform.title} category`);
        
        await prisma.game.update({
          where: { id: game.id },
          data: {
            categories: {
              disconnect: { id: category.id }
            }
          }
        });
      }
    }
    
    console.log('\nAll Game Boy categories fixed successfully!');
  } catch (error) {
    console.error('Error fixing Game Boy categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGameBoyCategories()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 