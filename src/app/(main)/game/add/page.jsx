import { PrismaClient } from '@prisma/client'
import GameForm from '@/components/GameForm'

// Mark the page as dynamic
export const dynamic = 'force-dynamic'
export const revalidate = 0

const prisma = new PrismaClient()

async function getGameCategories() {
  try {
    return await prisma.category.findMany({
      select: {
        id: true,
        title: true,
        slug: true
      }
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

export default async function AddGamePage() {
  let categories = []
  
  try {
    categories = await getGameCategories()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Add New Game</h1>
      <GameForm categories={categories} />
    </div>
  )
} 