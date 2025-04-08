/**
 * Fix All Duplicate Categories Script
 * 
 * This script identifies and fixes all duplicate platform categories in the database.
 * For each platform, it ensures there is only one category with the correct slug.
 * It moves all games from duplicate categories to the official one and deletes the duplicates.
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

// Define all platform mappings - canonical slug and possible variations
const platformMappings = [
  {
    canonicalSlug: 'nes',
    canonicalTitle: 'Nintendo Entertainment System',
    variations: ['nintendo', 'famicom', 'nintendo-entertainment-system']
  },
  {
    canonicalSlug: 'snes',
    canonicalTitle: 'Super Nintendo',
    variations: ['super-nintendo', 'super-famicom', 'super-nes']
  },
  {
    canonicalSlug: 'n64',
    canonicalTitle: 'Nintendo 64',
    variations: ['nintendo-64', 'nintendo64']
  },
  {
    canonicalSlug: 'gb',
    canonicalTitle: 'Game Boy',
    variations: ['gameboy', 'game-boy']
  },
  {
    canonicalSlug: 'gbc',
    canonicalTitle: 'Game Boy Color',
    variations: ['gameboy-color', 'game-boy-color']
  },
  {
    canonicalSlug: 'gba',
    canonicalTitle: 'Game Boy Advance',
    variations: ['gameboy-advance', 'game-boy-advance']
  },
  {
    canonicalSlug: 'nds',
    canonicalTitle: 'Nintendo DS',
    variations: ['nintendo-ds', 'ds']
  },
  {
    canonicalSlug: 'genesis',
    canonicalTitle: 'Sega Genesis',
    variations: ['megadrive', 'mega-drive', 'sega-genesis', 'genesis-sega']
  },
  {
    canonicalSlug: 'segacd',
    canonicalTitle: 'Sega CD',
    variations: ['sega-cd', 'mega-cd', 'megacd']
  },
  {
    canonicalSlug: 'saturn',
    canonicalTitle: 'Sega Saturn',
    variations: ['sega-saturn']
  },
  {
    canonicalSlug: 'psx',
    canonicalTitle: 'PlayStation',
    variations: ['playstation', 'ps1', 'sony-playstation']
  },
  {
    canonicalSlug: 'psp',
    canonicalTitle: 'PlayStation Portable',
    variations: ['playstation-portable', 'sony-psp']
  },
  {
    canonicalSlug: 'arcade',
    canonicalTitle: 'Arcade',
    variations: ['arcade-games']
  }
];

async function fixAllDuplicateCategories() {
  console.log('Starting duplicate categories fix script...');

  try {
    // Process each platform
    for (const platform of platformMappings) {
      await fixCategoryForPlatform(platform);
    }

    console.log('All platform categories fixed successfully!');
  } catch (error) {
    console.error('Error fixing categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixCategoryForPlatform(platform) {
  console.log(`\n=== Processing platform: ${platform.canonicalTitle} ===`);

  try {
    // Find the canonical category
    let canonicalCategory = await prisma.category.findFirst({
      where: { slug: platform.canonicalSlug },
    });

    // Create it if it doesn't exist
    if (!canonicalCategory) {
      console.log(`${platform.canonicalTitle} category not found! Creating it...`);
      canonicalCategory = await prisma.category.create({
        data: {
          title: platform.canonicalTitle,
          slug: platform.canonicalSlug
        }
      });
      console.log(`Created new ${platform.canonicalTitle} category with ID: ${canonicalCategory.id}`);
    } else {
      console.log(`Found ${platform.canonicalTitle} category: ID: ${canonicalCategory.id}, Slug: ${canonicalCategory.slug}`);
    }

    // Find games that should be in this category (core matches slug)
    const missingGames = await prisma.game.findMany({
      where: {
        core: platform.canonicalSlug,
        categories: {
          none: {
            id: canonicalCategory.id
          }
        }
      },
      include: {
        categories: true
      }
    });

    console.log(`Found ${missingGames.length} ${platform.canonicalTitle} games that are not in the correct category`);
    
    // Add these games to the correct category
    for (const game of missingGames) {
      console.log(`Adding game "${game.title}" to ${platform.canonicalTitle} category`);
      
      await prisma.game.update({
        where: { id: game.id },
        data: {
          categories: {
            connect: { id: canonicalCategory.id }
          }
        }
      });
    }

    // Find duplicate categories
    const duplicateCategories = await prisma.category.findMany({
      where: {
        AND: [
          { id: { not: canonicalCategory.id } },
          { 
            OR: [
              ...platform.variations.map(variation => ({ 
                slug: { contains: variation, mode: 'insensitive' } 
              })),
              { title: { contains: platform.canonicalTitle, mode: 'insensitive' } }
            ]
          }
        ]
      },
      include: {
        games: true
      }
    });

    console.log(`Found ${duplicateCategories.length} duplicate ${platform.canonicalTitle} categories`);
    
    // Process each duplicate category
    for (const category of duplicateCategories) {
      console.log(`Processing duplicate: ID: ${category.id}, Title: ${category.title}, Slug: ${category.slug}`);
      
      // Get games from this category
      const games = category.games;
      console.log(`Moving ${games.length} games to canonical ${platform.canonicalTitle} category`);
      
      // Move each game to the canonical category
      for (const game of games) {
        console.log(`Moving game: ${game.title}`);
        
        // Update the game's categories
        await prisma.game.update({
          where: { id: game.id },
          data: {
            categories: {
              disconnect: { id: category.id },
              connect: { id: canonicalCategory.id }
            }
          }
        });
      }
      
      // Delete the now-empty category
      console.log(`Deleting empty duplicate: ${category.title}`);
      await prisma.category.delete({
        where: { id: category.id }
      });
    }
    
    console.log(`${platform.canonicalTitle} platform categories fixed successfully!`);
  } catch (error) {
    console.error(`Error fixing ${platform.canonicalTitle} categories:`, error);
  }
}

fixAllDuplicateCategories()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 