export const dynamic = 'force-dynamic'

import HeroSlider from "@/components/Sliders/HeroSlider";
import CategorySlider from "@/components/Sliders/CategorySlider";
import GameCategoryWithCovers from "@/components/GameCategoryWithCovers";
import { getGameCategories, getCategoryBySlug } from "@/lib/gameQueries";
import { SiNintendo, SiPlaystation } from 'react-icons/si';
import { FaGamepad } from 'react-icons/fa';

export default async function Home() {
  try {
    // Get all categories for the slider
    const categories = await getGameCategories();

    // Get featured platform categories with their games
    const [nesGames, snesGames, n64Games, gbGames, psxGames] = await Promise.all([
      getCategoryBySlug('nes'),
      getCategoryBySlug('snes'),
      getCategoryBySlug('n64'),
      getCategoryBySlug('gb'),
      getCategoryBySlug('psx'),
    ]);
    
    // Filter out empty categories
    const platformCategories = [nesGames, snesGames, n64Games, gbGames, psxGames]
      .filter(category => category && category.games && category.games.length > 0);

    return (
      <>
        <div className="mb-6 text-center">
          <a 
            href="/platforms"
            className="inline-flex items-center gap-2 bg-gray-700 py-3 px-6 rounded-xl mr-4 hover:bg-gray-600 transition-colors"
          >
            <FaGamepad size={20} /> Browse Platforms
          </a>
          <a 
            href="/game/add" 
            className="inline-block bg-accent-gradient py-3 px-6 rounded-xl border border-yellow-400 uppercase hover:bg-accent/80 transition-colors"
          >
            ➕ Add Your Game
          </a>
        </div>

        <HeroSlider />
        
        {categories.length > 0 && (
          <div className="my-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaGamepad size={24} className="text-accent" />
              Browse by Platform
            </h2>
            <CategorySlider categories={categories} />
          </div>
        )}
        
        <div className="my-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <SiPlaystation size={24} className="text-accent" />
            Featured Collections
          </h2>
          {platformCategories.map(category => (
            <GameCategoryWithCovers key={category.id} category={category} />
          ))}
        </div>
      </>
    );
  } catch (error) {
    console.error('Error in Home page:', error);
    return <div>Error loading page content</div>;
  }
}
