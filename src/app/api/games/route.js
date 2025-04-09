import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * GET handler for retrieving a list of games with pagination
 * 
 * @param {Request} request - The incoming request
 * @returns {Response} - JSON response with games data
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    
    // Query parameters
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'title';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return Response.json({ error: 'Invalid page number' }, { status: 400 });
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return Response.json({ error: 'Invalid limit (1-100 allowed)' }, { status: 400 });
    }
    
    // Build the where clause for filtering
    let where = {};
    
    // Add search filter if provided
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Add category filter if provided
    if (category) {
      where.categories = {
        some: {
          slug: category
        }
      };
    }
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    // Validate sort parameters
    const validSortFields = ['title', 'createdAt', 'updatedAt'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      return Response.json({ error: 'Invalid sort field' }, { status: 400 });
    }
    
    if (!validSortOrders.includes(sortOrder)) {
      return Response.json({ error: 'Invalid sort order' }, { status: 400 });
    }
    
    // Execute the query with a count of total items
    const [games, totalCount] = await Promise.all([
      prisma.game.findMany({
        where,
        include: {
          categories: true
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.game.count({ where })
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Prepare pagination links
    const baseUrl = `${process.env.NEXT_PUBLIC_URL || ''}/api/games`;
    const buildPageUrl = (p) => {
      const url = new URL(baseUrl);
      url.searchParams.set('page', p.toString());
      url.searchParams.set('limit', limit.toString());
      if (search) url.searchParams.set('search', search);
      if (category) url.searchParams.set('category', category);
      if (sortBy) url.searchParams.set('sortBy', sortBy);
      if (sortOrder) url.searchParams.set('sortOrder', sortOrder);
      return url.toString();
    };
    
    // Add cache headers
    const headers = new Headers();
    headers.append('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    
    return Response.json({
      data: games,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? buildPageUrl(page + 1) : null,
        prevPage: page > 1 ? buildPageUrl(page - 1) : null
      }
    }, { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    return Response.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

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

    try {
      // Handle category
      let categoryId = data.category?.id;
      
      // If no existing category ID but has title, create new category
      if (!categoryId && data.category?.title) {
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
        region: data.region || null,
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
    } catch (dbError) {
      console.error('Database error:', dbError);
      return Response.json(
        { error: 'Database error: ' + dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating game:', error);
    return Response.json(
      { error: 'Failed to create game: ' + error.message },
      { status: 500 }
    );
  } finally {
    // Optional: Disconnect from the database
    // await prisma.$disconnect();
  }
}