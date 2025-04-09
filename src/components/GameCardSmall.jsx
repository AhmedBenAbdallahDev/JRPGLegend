'use client';
import { useState, useEffect } from 'react';
import EnhancedGameCover from "./EnhancedGameCover";
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';
import Link from 'next/link';
import GameBadges from './Badge';

export default function GameCardSmall({ game, category, onClick }) {
  if (!game) return null;
  
  // Function to get the appropriate icon for each platform category
  const getCategoryIcon = (slug) => {
    const iconSize = 18; // Smaller icon size for compact view
    
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
  
  const cardContent = (
    <>
      <div className="flex h-16 overflow-hidden rounded-lg">
        <div className="w-16 h-16 flex-shrink-0">
          <EnhancedGameCover 
            game={game} 
            width={64}
            height={64}
            className="w-full h-full"
            hideInternalBadges={true}
          />
        </div>
        <div className="px-2 py-1 flex flex-col justify-between flex-grow">
          <div>
            <h3 className="text-sm font-medium truncate">{game.title}</h3>
            <div className="flex items-center gap-1 text-xs text-accent">
              <span>{getCategoryIcon(game?.categorySlug || category)}</span>
              <p className="truncate">{category}</p>
            </div>
          </div>
          
          <div className="flex gap-1 flex-wrap">
            <div className="scale-75 origin-left">
              <GameBadges game={game} />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // If onClick is provided, make the card interactive without navigation
  if (onClick) {
    return (
      <button 
        onClick={() => onClick(game)} 
        className="w-full text-left hover:bg-accent/10 rounded-lg transition-colors"
      >
        {cardContent}
      </button>
    );
  }
  
  // Otherwise, make it a link to the game page
  return (
    <Link 
      href={`/game/${game.slug}`} 
      className="block hover:bg-accent/10 rounded-lg transition-colors"
    >
      {cardContent}
    </Link>
  );
} 