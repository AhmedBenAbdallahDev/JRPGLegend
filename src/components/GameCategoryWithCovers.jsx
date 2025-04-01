import { ChevronRightIcon } from "@heroicons/react/24/outline";
import GameCard from "./GameCard";
import { SiNintendo, SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';

export default function GameCategoryWithCovers({category}) {
  if (!category || !category.games) {
    return null;
  }

  // Function to get the appropriate icon for each platform category
  const getCategoryIcon = (slug) => {
    const iconSize = 24;
    
    if (!slug) return <FaGamepad size={iconSize} />;
    
    switch (slug) {
      case 'nes':
      case 'snes':
        return <SiNintendo size={iconSize} />;
      case 'n64':
        return <SiNintendo size={iconSize} />;
      case 'gb':
      case 'gbc':
      case 'gba':
        return <FaMobileAlt size={iconSize} />;
      case 'nds':
        return <SiNintendo size={iconSize} />;
      case 'genesis':
      case 'segacd':
      case 'saturn':
        return <SiSega size={iconSize} />;
      case 'psx':
      case 'psp':
        return <SiPlaystation size={iconSize} />;
      case 'arcade':
        return <FaGamepad size={iconSize} />;
      default:
        return <FaGamepad size={iconSize} />;
    }
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between gap-4 items-center">
        <h2 className="font-display mb-4 flex items-center gap-2">
          <span className="text-accent">{getCategoryIcon(category.slug)}</span>
          {category.title}
        </h2>
        <a href={`/category/${category.slug}`} className="text-sm font-medium hover:underline underline-offset-4 flex items-center">
          View All <ChevronRightIcon className="h-4 w-4 inline-block text-accent"/>
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {category.games.map((game) => (
          game && <GameCard key={game.id} game={game} category={category.title} />
        ))}
      </div>
    </section>
  );
} 