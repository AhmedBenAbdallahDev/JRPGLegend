const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getN64Games() {
  try {
    const n64Category = await prisma.category.findUnique({
      where: { slug: 'n64' },
      include: {
        games: {
          take: 10,
          orderBy: { title: 'asc' }
        }
      }
    });
    
    if (n64Category) {
      console.log('First 10 N64 games:');
      n64Category.games.forEach(game => console.log(game.title));
    } else {
      console.log('N64 category not found');
    }
  } catch (error) {
    console.error('Error fetching N64 games:', error);
  } finally {
    await prisma.$disconnect();
 