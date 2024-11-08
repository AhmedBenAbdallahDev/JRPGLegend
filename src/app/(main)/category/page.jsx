import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

async function getCategories() {
  try {
    return await prisma.category.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        games: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

export default async function Page() {
  const categories = await getCategories();

  return(
    <div>
      <h1 className="font-display text-3xl mb-4">Categories</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
      {categories.map((category) => (
        <a href={`/category/${category.slug}`} key={category.id} className="group">
          <div className="overflow-hidden rounded-lg border-accent-secondary border">
            <img
              src={`./category/${category.games[0].image}`}
              width={300}
              height={300}
              alt={category.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
          </div>
          <h1>{category.title}</h1>
          <p>{category.games.length} games</p>
        </a>
      ))}

      </div>
    </div>
  )
}