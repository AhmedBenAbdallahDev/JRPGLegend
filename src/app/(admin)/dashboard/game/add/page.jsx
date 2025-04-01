import Header from "@/components/Admin/Header"
import { getGameCategories } from "@/lib/adminQueries"
import GameFormWithScreenscraper from "@/components/GameForm"

export default async function Page() {
  const categories = await getGameCategories();

  return (
    <>
      <Header />

      <div className="container mx-auto mb-8 px-4 min-h-[50rem] pb-8 relative mt-10">
        <a href="/dashboard" className="text-sm">&#8592; Back</a>
        <div className="flex justify-between gap-4 mb-4">
          <h1 className="font-display">Add New Game</h1>
        </div>

        <GameFormWithScreenscraper categories={categories} />

      </div>


    
    </>
  )
}