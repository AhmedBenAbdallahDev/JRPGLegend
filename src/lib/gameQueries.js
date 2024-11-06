import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Add connection test
prisma.$connect()
  .then(() => console.log('Database connected successfully'))
  .catch((error) => console.error('Database connection failed:', error));

// Add a more robust error handler
const handlePrismaOperation = async (operation, operationName) => {
  try {
    console.log(`Starting ${operationName}...`);
    const result = await operation();
    console.log(`${operationName} completed successfully`);
    return result;
  } catch (error) {
    console.error(`Error in ${operationName}:`, {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Database operation '${operationName}' failed: ${error.message}`);
  }
};

export async function getAllGames() {
  return await prisma.game.findMany({});
}

export async function getGamesByCategory(categorySlug, page = 1) {
  const ITEMS_PER_PAGE = 20;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [games, totalCount] = await Promise.all([
    prisma.game.findMany({
      where: {
        categories: {
          some: {
            slug: categorySlug,
          },
        },
      },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.game.count({
      where: {
        categories: {
          some: {
            slug: categorySlug,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  return { games, totalPages, currentPage: page };
}

export async function getGameBySlug(slug) {
  return await prisma.game.findUnique({
    where: {
      slug: slug,
    },
    include: {
      categories: true,
    },
  });
}

export async function getGamesBySelectedCategories(categoryIds) {
  return await prisma.category.findMany({
    where: {
      id: {
        in: categoryIds,
      },
      games: {
        some: {
          published: true,
        },
      },
    },
    select: {
      title: true,
      slug: true,
      games: {
        where: {
          published: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          image: true,
          game_url: true,
          created_at: true,
        },
      },
    },
  });
}

export async function getGamesByCategoryId(categoryId) {
  return handlePrismaOperation(async () => {
    console.log(`Fetching category with ID: ${categoryId}`);
    
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        games: {
          where: {
            published: true,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            published: true
          },
          take: 8,
        },
      },
    });

    if (!category) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    console.log(`Found category: ${category.title} with ${category.games?.length || 0} games`);
    return category;
  }, 'getGamesByCategoryId');
}

export async function getGameCategories() {
  return handlePrismaOperation(async () => {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        image: true
      }
    });

    console.log(`Found ${categories?.length || 0} categories`);
    return categories;
  }, 'getGameCategories');
}

export async function getCategoryMenu() {
  return await prisma.category.findMany({
    include: {
      games: true,
    },
  });
}

export async function getSearchResults(params) {
  return await prisma.game.findMany({
    where: {
      title: {
        contains: params,
      },
    },
    take: 100,
  });
}
