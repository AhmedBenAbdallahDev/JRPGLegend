/**
 * Fix Other Categories Script
 * 
 * This script checks for any platform categories that are being mistakenly shown in the "Other" section
 * of the sidebar and fixes their classification by ensuring they have the correct slug.
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

// Main console categories that should appear in their proper groups
const validConsoleCategories = {
  nintendo: ['nes', 'snes', 'n64', 'gb', 'gbc', 'gba', 'nds'],
  sega: ['genesis', 'segacd', 'saturn'],
  sony: ['psx', 'psp'],
  other: ['arcade'] // Official "other" categories
};

// Potential misspellings or variations to check for
const platformVariations = {
  'snes': ['super-nintendo', 'super-nes', 'supernintendo'],
  'nes': ['nintendo', 'famicom', 'nintendo-entertainment-system'],
  'n64': ['nintendo-64', 'nintendo64'],
  'gb': ['gameboy', 'game-boy'],
  'gbc': ['gameboy-color', 'game-boy-color'],
  'gba': ['gameboy-advance', 'game-boy-advance'],
  'nds': ['nintendo-ds', 'ds'],
  'genesis': ['megadrive', 'mega-drive', 'sega-genesis', 'genesis-sega'],
  'segacd': ['sega-cd', 'mega-cd', 'megacd'],
  'saturn': ['sega-saturn'],
  'psx': ['playstation', 'ps1', 'sony-playstation'],
  'psp': ['playstation-portable', 'sony-psp'],
  'arcade': ['arcade-games']
};

// Function to check if a category should belong to a specific console group
function determineConsoleGroup(slug) {
  if (validConsoleCategories.nintendo.includes(slug)) return 'nintendo';
  if (validConsoleCategories.sega.includes(slug)) return 'sega';
  if (validConsoleCategories.sony.includes(slug)) return 'sony';
  if (validConsoleCategories.other.includes(slug)) return 'other';
  
  // Check for variations
  for (const [canonical, variations] of Object.entries(platformVariations)) {
    if (variations.includes(slug.toLowerCase())) {
      // Find which group the canonical slug belongs to
      if (validConsoleCategories.nintendo.includes(canonical)) return 'nintendo';
      if (validConsoleCategories.sega.includes(canonical)) return 'sega';
      if (validConsoleCategories.sony.includes(canonical)) return 'sony';
      if (validConsoleCategories.other.includes(canonical)) return 'other';
    }
  }
  
  return 'unknown';
}

async function fixOtherCategories() {
  console.log('Starting fix for categories in "Other" section...');

  try {
    // Get all categories
    const allCategories = await prisma.category.findMany({
      include: {
        games: {
          select: {
            id: true,
            title: true,
            core: true
          }
        }
      }
    });

    console.log(`Found ${allCategories.length} total categories`);
    
    // Identify categories that would appear in "Other" but should be in console groups
    const misplacedCategories = allCategories.filter(category => {
      const slug = category.slug.toLowerCase();
      // If not in any of the valid console categories lists
      const notInValidLists = !validConsoleCategories.nintendo.includes(slug) &&
                             !validConsoleCategories.sega.includes(slug) &&
                             !validConsoleCategories.sony.includes(slug) &&
                             !validConsoleCategories.other.includes(slug);
      
      // But should be in a console group based on variations
      const shouldBeInGroup = determineConsoleGroup(slug) !== 'unknown';
      
      return notInValidLists && shouldBeInGroup;
    });

    if (misplacedCategories.length === 0) {
      console.log('No misplaced categories found that should be in console groups!');
      return;
    }

    console.log(`Found ${misplacedCategories.length} categories that should be properly grouped:`);
    
    // Process each misplaced category
    for (const category of misplacedCategories) {
      const slug = category.slug.toLowerCase();
      const consoleGroup = determineConsoleGroup(slug);
      
      console.log(`\nProcessing category: ${category.title} (${category.slug})`);
      console.log(`  Should be in: ${consoleGroup} group`);
      
      // Find the canonical slug for this category
      let canonicalSlug = slug;
      for (const [canonical, variations] of Object.entries(platformVariations)) {
        if (variations.includes(slug)) {
          canonicalSlug = canonical;
          break;
        }
      }
      
      if (canonicalSlug !== slug) {
        console.log(`  Canonical slug should be: ${canonicalSlug}`);
        
        // Check if a category with the canonical slug already exists
        const existingCanonical = await prisma.category.findUnique({
          where: { slug: canonicalSlug },
          include: { games: true }
        });
        
        if (existingCanonical) {
          console.log(`  A category with the canonical slug already exists (ID: ${existingCanonical.id})`);
          console.log(`  Moving ${category.games.length} games to the canonical category`);
          
          // Move games to the canonical category
          for (const game of category.games) {
            console.log(`    Moving game: ${game.title}`);
            await prisma.game.update({
              where: { id: game.id },
              data: {
                categories: {
                  connect: { id: existingCanonical.id },
                  disconnect: { id: category.id }
                }
              }
            });
          }
          
          // Delete the old category if it's now empty
          console.log(`  Deleting the old category: ${category.title}`);
          await prisma.category.delete({
            where: { id: category.id }
          });
          
        } else {
          // Just update the slug to the canonical one
          console.log(`  Updating slug from ${category.slug} to ${canonicalSlug}`);
          await prisma.category.update({
            where: { id: category.id },
            data: { slug: canonicalSlug }
          });
        }
      } else {
        console.log(`  Category has correct slug but is not being properly categorized in UI.`);
        console.log(`  No database changes needed.`);
      }
    }

    console.log('\nCompleted fixing categories in "Other" section!');
    
  } catch (error) {
    console.error('Error fixing categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixOtherCategories()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  }); 