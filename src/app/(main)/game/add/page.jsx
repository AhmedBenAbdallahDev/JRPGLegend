import { getGameCategories } from "@/lib/gameQueries"
import GameForm from "@/components/GameForm";

export default async function AddGamePage() {
  const categories = await getGameCategories();

  return (
    <div className="container mx-auto px-4 py-8">
      <a href="/" className="text-sm hover:text-accent">&#8592; Back to Home</a>
      
      <h1 className="text-2xl font-display text-center mb-8">Add Your Game</h1>
      
      <div className="max-w-2xl mx-auto bg-secondary p-6 rounded-xl border border-accent-secondary">
        <GameForm categories={categories} />
      </div>
    </div>
  )
} 