import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validation
    if (!data.title?.trim()) {
      return Response.json({ error: 'Game title is required' }, { status: 400 });
    }
    if (!data.game_url?.trim()) {
      return Response.json({ error: 'Game URL is required' }, { status: 400 });
    }

    // Create slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // For creating games
    const gameData = {
      title: data.title,
      slug: slug,
      description: data.description,
      image: data.image,
      gameLink: data.gameLink,
      core: data.core,
      categories: {
        connect: data.categoryId ? [{ id: data.categoryId }] : []
      }
    };

    const game = await prisma.game.create({
      data: gameData,
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