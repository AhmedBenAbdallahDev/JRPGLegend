'use client';
import EnhancedGameCover from "./EnhancedGameCover";
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';
import GameBadges from './Badge';

export default function GameCard({ game, category }) {
  if (!game) return null;
  
  // Function to get the appropriate icon for each platform category
  const getCategoryIcon = (slug) => {
    const iconSize = 24;
    
    if (!slug) return <FaGamepad size={iconSize} />;
    
    switch (slug) {
      case 'nes':
      case 'snes':
        return <FaGamepad size={iconSize} />;
      case 'n64':
        return <FaGamepad size={iconSize} />;
      case 'gb':
      case 'gbc':
      case 'gba':
        return <FaMobileAlt size={iconSize} />;
      case 'nds':
        return <FaGamepad size={iconSize} />;
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
    <a href={`/game/${game.slug}`} className="group relative">
      <div className="overflow-hidden rounded-lg border border-accent-secondary mb-2">
        <EnhancedGameCover 
          game={game} 
          width={300}
          height={200}
          className="w-full h-full"
          hideInternalBadges={true}
        />
        
        {/* Badge container - positioned at top-right corner */}
        <div className="absolute top-2 right-2">
          <GameBadges game={game} />
        </div>
      </div>
      
      <div className="flex items-center gap-1 text-sm text-accent">
        <span>{getCategoryIcon(game?.categorySlug || category)}</span>
        <p>{category}</p>
      </div>
      <h1 className="font-medium">{game.title}</h1>
    </a>
  );
} 