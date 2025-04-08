/**
 * Check SNES Categories Script
 * 
 * This script identifies any duplicate Super Nintendo/SNES categories in the database.
 * It displays information about both 'snes' and 'super-nintendo' categories if they exist.
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

async function checkSnesCategories() {
  console.log('Checking for duplicate SNES categories...');

  try {
    // Test connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connection successful!');

    // Find the canonical SNES category
    const snesCategory = await prisma.category.findFirst({
      where: { slug: 'snes' },
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

    // Find any super-nintendo categories
    const superNintendoCategories = await prisma.category.findMany({
      where: {
        AND: [
          { slug: { not: 'snes' } },
          { 
            OR: [
              { title: { contains: 'Super Nintendo', mode: 'insensitive' } },
              { slug: { contains: 'super-nintendo', mode: 'insensitive' } }
            ]
          }
        ]
      },
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

    // Display results
    console.log('\n=== SNES Categories Report ===\n');
    
    if (snesCategory) {
      console.log(`Official SNES Category:`);
      console.log(`  ID: ${snesCategory.id}`);
      console.log(`  Title: ${snesCategory.title}`);
      console.log(`  Slug: ${snesCategory.slug}`);
      console.log(`  Games: ${snesCategory.games.length}`);
      
      if (snesCategory.games.length > 0) {
        console.log('\n  Games in official SNES category:');
        snesCategory.games.forEach(game => {
          console.log(`    - ${game.title} (Core: ${game.core})`);
        });
      }
    } else {
      console.log('No official SNES category (slug: "snes") found!');
    }

    console.log('\n');

    if (superNintendoCategories.length > 0) {
      console.log(`Found ${superNintendoCategories.length} duplicate "Super Nintendo" categories:`);
      
      superNintendoCategories.forEach((category, index) => {
        console.log(`\nDuplicate Category #${index + 1}:`);
        console.log(`  ID: ${category.id}`);
        console.log(`  Title: ${category.title}`);
        console.log(`  Slug: ${category.slug}`);
        console.log(`  Games: ${category.games.length}`);
        
        if (category.games.length > 0) {
          console.log('\n  Games in this duplicate category:');
          category.games.forEach(game => {
            console.log(`    - ${game.title} (Core: ${game.core})`);
          });
        }
      });
      
      console.log('\nSuggested fix: Run the fix-all-duplicate-categories.js script to merge these categories.');
    } else {
      console.log('No duplicate "Super Nintendo" categories found!');
    }

  } catch (error) {
    console.error('Error checking SNES categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script and wait for it to complete
checkSnesCategories()
  .then(() => {
    console.log("Script completed successfully.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  }); 