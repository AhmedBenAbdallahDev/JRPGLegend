'use client';
import EnhancedGameCover from "./EnhancedGameCover";
import { SiNintendo, SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';

export default function GameCard({ game, category }) {
  if (!game) return null;
  
  // Function to get the appropriate icon for each platform category
  const getCategoryIcon = (slug) => {
    const iconSize = 16;
    
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
    <a href={`/game/${game.slug}`} className="group">
      <div className="overflow-hidden rounded-lg border border-accent-secondary mb-2">
        <EnhancedGameCover 
          game={game} 
          width={300}
          height={200}
          className="w-full h-full"
        />
      </div>
      {category && (
        <div className="flex items-center gap-1 text-sm text-accent">
          <span>{getCategoryIcon(game?.categorySlug || category)}</span>
          <p>{category}</p>
        </div>
      )}
      <h1 className="font-medium">{game.title}</h1>
    </a>
  );
} 