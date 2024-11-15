import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validation
    if (!data.title?.trim()) {
      return Response.json({ error: 'Game title is required' }, { status: 400 });
    }
    if (!data.gameLink?.trim()) {
      return Response.json({ error: 'Game ROM URL is required' }, { status: 400 });
    }
    if (!data.core?.trim()) {
      return Response.json({ error: 'Emulator core is required' }, { status: 400 });
    }

    // Create slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Handle category
    let categoryId = data.category.id;
    
    // If no existing category ID but has title, create new category
    if (!categoryId && data.category.title) {
      const newCategory = await prisma.category.create({
        data: {
          title: data.category.title,
          slug: data.category.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        }
      });
      categoryId = newCategory.id;
    }

    // Create game with category connection
    const gameData = {
      title: data.title,
      slug,
      description: data.description || '',
      image: data.image || '',
      gameLink: data.gameLink,
      core: data.core,
      published: true,
      ...(categoryId && {
        categories: {
          connect: [{ id: categoryId }]
        }
      })
    };

    const game = await prisma.game.create({
      data: gameData,
      include: {
        categories: true
      }
    });

    return Response.json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    return Response.json(
      { error: 'Failed to create game. Please try again.' },
      { status: 500 }
    );
  }
}