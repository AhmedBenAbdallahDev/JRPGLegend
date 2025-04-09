'use client';
import { useState, useEffect } from 'react';
import EnhancedGameCover from "./EnhancedGameCover";
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt, FaDesktop, FaGlobeAmericas } from 'react-icons/fa';
import Link from 'next/link';

export default function GameCardSmall({ game, category, onClick }) {
  if (!game) return null;
  
  // State for badge visibility settings - load from localStorage just like GameCard
  const [badgeSettings, setBadgeSettings] = useState({
    showLocalBadge: true,
    showRegionBadge: true
  });
  
  // Load badge visibility settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedSettings = localStorage.getItem('badgeVisibilitySettings');
        if (storedSettings) {
          setBadgeSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('Error loading badge settings:', error);
      }
    }
  }, []);
  
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
  
  // Check if game is from local storage
  const isLocal = game.isLocal || game.gameLink?.startsWith('file://') || false;
  
  // Get badge for region
  const getRegionBadge = () => {
    if (!game.region) return null;
    
    const regionColors = {
      'us': 'bg-blue-600',
      'jp': 'bg-red-600',
      'eu': 'bg-yellow-600',
      'world': 'bg-green-600',
      'other': 'bg-purple-600'
    };
    
    const regionNames = {
      'us': 'USA',
      'jp': 'Japan',
      'eu': 'Europe',
      'world': 'World',
      'other': 'Other'
    };
    
    return (
      <div className={`${regionColors[game.region] || 'bg-gray-600'} text-white text-xs px-1 py-0.5 rounded-sm flex items-center gap-0.5`}>
        <FaGlobeAmericas className="w-2 h-2" />
        <span>{regionNames[game.region] || game.region}</span>
      </div>
    );
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
            {/* Local game badge */}
            {isLocal && badgeSettings.showLocalBadge && (
              <span className="bg-yellow-500/20 text-yellow-500 text-xs px-1 rounded-sm flex items-center gap-0.5">
                <FaDesktop className="w-2 h-2" />
                <span>Local</span>
              </span>
            )}
            
            {/* Region badge */}
            {game.region && badgeSettings.showRegionBadge && getRegionBadge()}
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