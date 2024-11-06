export const dynamic = 'force-dynamic'

import HeroSlider from "@/components/Sliders/HeroSlider";
import CategorySlider from "@/components/Sliders/CategorySlider";
import GameCategory from "@/components/GameCategory";
import { getGameCategories, getGamesByCategoryId, getGamesBySelectedCategories } from "@/lib/gameQueries";

export default async function Home() {
  try {
    const [categories, category] = await Promise.all([
      getGameCategories(),
      getGamesByCategoryId(1)
    ]);

    return (
      <>
        <div className="mb-6 text-center">
          <a 
            href="/game/add" 
            className="inline-block bg-accent-gradient py-3 px-6 rounded-xl border border-yellow-400 uppercase hover:bg-accent/80 transition-colors"
          >
            🎮 Add Your Game
          </a>
        </div>

        <HeroSlider />
        {categories.length > 0 && <CategorySlider categories={categories} />}
        {category && <GameCategory category={category} />}
      </>
    );
  } catch (error) {
    console.error('Error in Home page:', error);
    return <div>Error loading page content</div>;
  }
}
