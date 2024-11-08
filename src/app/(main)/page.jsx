import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

async function getGames() {
  try {
    return await prisma.game.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        categories: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch games:', error)
    return []
  }
} 