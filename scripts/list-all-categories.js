/**
 * List All Categories Script
 * 
 * This script lists all categories in the database with their IDs, titles, 
 * slugs, and game counts to help diagnose sidebar navigation issues.
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

async function listAllCategories() {
  console.log('Fetching all categories from database...');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connection successful!');

    // Get all categories with their games
    const categories = await prisma.category.findMany({
      include: {
        games: true,
      },
    });

    console.log(`\nTotal categories found: ${categories.length}\n`);
    console.log('=== CATEGORY LIST ===');
    console.log('ID | Title | Slug | Game Count');
    console.log('------------------------------------');
    
    // Define console type groups for better organization
    const nintendoSlugs = ['nes', 'snes', 'n64', 'gb', 'gbc', 'gba', 'nds'];
    const segaSlugs = ['genesis', 'segacd', 'saturn'];
    const sonySlugs = ['psx', 'psp'];
    const otherSlugs = ['arcade'];
    
    // Group categories by console type for display
    const nintendo = categories.filter(cat => nintendoSlugs.includes(cat.slug));
    const sega = categories.filter(cat => segaSlugs.includes(cat.slug));
    const sony = categories.filter(cat => sonySlugs.includes(cat.slug));
    const other = categories.filter(cat => !nintendoSlugs.includes(cat.slug) && 
                                          !segaSlugs.includes(cat.slug) && 
                                          !sonySlugs.includes(cat.slug) &&
                                          !otherSlugs.includes(cat.slug));

    // Helper to print categories by group
    const printCategories = (group, name) => {
      if (group.length > 0) {
        console.log(`\n--- ${name} ---`);
        group.forEach(category => {
          console.log(`${category.id.substring(0,8)}... | ${category.title} | ${category.slug} | ${category.games.length}`);
        });
      }
    };
    
    // Print by group
    printCategories(nintendo, "Nintendo Systems");
    printCategories(sega, "Sega Systems");
    printCategories(sony, "Sony Systems");
    printCategories(other, "Other Categories");
    
    // Check for potential UI categorization issues
    const potentialIssues = categories.filter(cat => {
      // Check for problematic titles
      if (cat.title.toLowerCase().includes('super nintendo') && cat.slug !== 'snes') {
        return true;
      }
      // Any other naming inconsistencies
      return false;
    });
    
    if (potentialIssues.length > 0) {
      console.log('\n=== POTENTIAL ISSUES ===');
      potentialIssues.forEach(category => {
        console.log(`ID: ${category.id}`);
        console.log(`Title: ${category.title}`);
        console.log(`Slug: ${category.slug}`);
        console.log(`Game Count: ${category.games.length}`);
        console.log('-----');
      });
      console.log('These categories may be incorrectly categorized in the sidebar.');
    } else {
      console.log('\nNo potential category naming inconsistencies found.');
    }

  } catch (error) {
    console.error('Error fetching categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
listAllCategories()
  .then(() => {
    console.log("\nScript completed successfully.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  }); 