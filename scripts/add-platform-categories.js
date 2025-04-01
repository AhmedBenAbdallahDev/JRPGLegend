const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating platform categories...');

  const platforms = [
    // Nintendo Systems
    { title: 'Nintendo Entertainment System', slug: 'nes' },
    { title: 'Super Nintendo', slug: 'snes' },
    { title: 'Nintendo 64', slug: 'n64' },
    { title: 'Game Boy', slug: 'gb' },
    { title: 'Game Boy Color', slug: 'gbc' },
    { title: 'Game Boy Advance', slug: 'gba' },
    { title: 'Nintendo DS', slug: 'nds' },
    
    // Sega Systems
    { title: 'Sega Genesis', slug: 'genesis' },
    { title: 'Sega CD', slug: 'segacd' },
    { title: 'Sega Saturn', slug: 'saturn' },
    
    // Sony Systems
    { title: 'PlayStation', slug: 'psx' },
    { title: 'PlayStation Portable', slug: 'psp' },
    
    // Other Systems
    { title: 'Arcade', slug: 'arcade' }
  ];

  for (const platform of platforms) {
    // Check if the category already exists
    const existingCategory = await prisma.category.findUnique({
      where: {
        slug: platform.slug
      }
    });

    if (!existingCategory) {
      // Create the category if it doesn't exist
      const category = await prisma.category.create({
        data: {
          title: platform.title,
          slug: platform.slug
        }
      });
      console.log(`Created category: ${platform.title}`);
    } else {
      console.log(`Category already exists: ${platform.title}`);
    }
  }

  console.log('Platform categories created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 