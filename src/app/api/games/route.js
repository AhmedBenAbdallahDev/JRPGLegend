import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const data = await req.json();
    
    // Create or find categories first
    const categoryPromises = data.categories.map(async (cat) => {
      return await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          title: cat.title,
          slug: cat.slug
        }
      });
    });

    const categories = await Promise.all(categoryPromises);

    // Create the game with the categories
    const game = await prisma.game.create({
      data: {
        title: data.title,
        slug: data.slug,
        game_url: data.game_url,
        image: data.image,
        categories: {
          connect: categories.map(cat => ({ id: cat.id }))
        }
      }
    });

    return Response.json(game);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Error creating game" },
      { status: 500 }
    );
  }
} 