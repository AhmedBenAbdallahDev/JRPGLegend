const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        title: 'Action',
        slug: 'action',
        image: 'action.png',
      },
    }),
    prisma.category.create({
      data: {
        title: 'Adventure',
        slug: 'adventure',
        image: 'adventure.png',
      },
    }),
    prisma.category.create({
      data: {
        title: 'RPG',
        slug: 'rpg',
        image: 'rpg.png',
      },
    }),
    // Add more categories as needed
  ]);

  console.log('Seeded categories:', categories);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });