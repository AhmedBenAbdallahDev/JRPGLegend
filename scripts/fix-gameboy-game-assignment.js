/**
 * Fix Game Boy Categories Game Assignment
 * 
 * This script ensures games are assigned to the correct Game Boy categories based on their cores.
 * Games with 'gb' core should be in Game Boy category only
 * Games with 'gba' core should be in Game Boy Advance category only
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

async function fixGameBoyCategories() {
  console.log('Starting Game Boy categories fix...');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connection successful!');

    // Find Game Boy category (gb core)
    const gameBoyCat = await prisma.category.findFirst({
      where: { slug: 'gb' },
      include: { games: true }
    });

    // Find Game Boy Advance category (gba core)
    const gbaCat = await prisma.category.findFirst({
      where: { slug: 'gba' },
      include: { games: true }
    });

    // Find Game Boy Color category (gbc core)
    const gbcCat = await prisma.category.findFirst({
      where: { slug: 'gbc' },
      include: { games: true }
    });

    if (!gameBoyCat) {
      console.log('Error: Game Boy category not found!');
      return;
    }

    if (!gbaCat) {
      console.log('Error: Game Boy Advance category not found!');
      return;
    }

    console.log(`Found Game Boy category (${gameBoyCat.id}) with ${gameBoyCat.games.length} games.`);
    console.log(`Found GBA category (${gbaCat.id}) with ${gbaCat.games.length} games.`);
    if (gbcCat) {
      console.log(`Found GBC category (${gbcCat.id}) with ${gbcCat.games.length} games.`);
    } else {
      console.log('Note: GBC category not found. GBC games will be assigned to GB category.');
    }

    // Get all games with Game Boy related cores
    const allGamesWithGB = await prisma.game.findMany({
      where: {
        OR: [
          { core: 'gb' },
          { core: 'gba' },
          { core: 'gbc' }
        ]
      },
      include: {
        categories: true
      }
    });

    console.log(`\nFound ${allGamesWithGB.length} total Game Boy games to process.`);

    // Process each game
    for (const game of allGamesWithGB) {
      console.log(`\nProcessing game: ${game.title} (Core: ${game.core})`);
      
      // Get game's current categories
      const currentCatIds = game.categories.map(c => c.id);
      
      // Determine correct category based on core
      let correctCatId;
      let wrongCatIds = [];
      
      if (game.core === 'gb') {
        correctCatId = gameBoyCat.id;
        wrongCatIds = [gbaCat.id];
        if (gbcCat) wrongCatIds.push(gbcCat.id);
      } 
      else if (game.core === 'gba') {
        correctCatId = gbaCat.id;
        wrongCatIds = [gameBoyCat.id];
        if (gbcCat) wrongCatIds.push(gbcCat.id);
      }
      else if (game.core === 'gbc') {
        correctCatId = gbcCat ? gbcCat.id : gameBoyCat.id; // If no GBC category, use GB
        wrongCatIds = gbcCat ? [gameBoyCat.id, gbaCat.id] : [gbaCat.id];
      }
      
      // Filter wrong categories that the game actually has
      wrongCatIds = wrongCatIds.filter(id => currentCatIds.includes(id));
      
      // Check if game needs to be updated
      const needsAddToCorrect = !currentCatIds.includes(correctCatId);
      const needsRemoveFromWrong = wrongCatIds.length > 0;
      
      if (!needsAddToCorrect && !needsRemoveFromWrong) {
        console.log(`  Game already in correct category only. No changes needed.`);
        continue;
      }
      
      // Update game categories
      try {
        const updateData = {
          categories: {}
        };
        
        if (needsAddToCorrect) {
          console.log(`  Adding game to correct category based on core '${game.core}'`);
          updateData.categories.connect = { id: correctCatId };
        }
        
        if (needsRemoveFromWrong) {
          console.log(`  Removing game from ${wrongCatIds.length} incorrect categories`);
          updateData.categories.disconnect = wrongCatIds.map(id => ({ id }));
        }
        
        await prisma.game.update({
          where: { id: game.id },
          data: updateData
        });
        
        console.log(`  ✓ Game updated successfully!`);
      } catch (error) {
        console.error(`  Error updating game: ${error.message}`);
      }
    }

    console.log('\nGame Boy categories fix completed!');

  } catch (error) {
    console.error('Error fixing Game Boy categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixGameBoyCategories()
  .then(() => {
    console.log("\nScript completed successfully.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  }); 