'use client';
import { useState, useEffect } from 'react';
import EnhancedGameCover from "./EnhancedGameCover";
import Image from 'next/image';
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt, FaDesktop, FaGlobeAmericas } from 'react-icons/fa';
import { HiPhotograph } from 'react-icons/hi';
import { TbWifi, TbWifiOff } from 'react-icons/tb';

export default function GameCard({ game, category }) {
  if (!game) return null;
  
  // State for badge visibility settings
  const [badgeSettings, setBadgeSettings] = useState({
    showLocalBadge: true,
    showCachedBadge: true,
    showRegionBadge: true,
    showImageSourceBadge: true
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
  
  // Check if game is from local storage
  const isLocal = game.isLocal || game.gameLink?.startsWith('file://') || false;
  
  // Check if game image is cached
  const isCached = game.image?.startsWith('http') || game.image?.includes(':');
  
  // Get image source (wikimedia, local, or custom)
  const getImageSource = () => {
    if (!game.image) return 'default';
    if (game.image.startsWith('wikimedia:')) return 'wikimedia';
    if (game.image.startsWith('tgdb:')) return 'tgdb';
    if (game.image.startsWith('screenscraper:')) return 'screenscraper';
    if (game.image.startsWith('file://')) return 'local';
    if (game.image.startsWith('http')) return 'external';
    return 'custom';
  };

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
      <div className={`${regionColors[game.region] || 'bg-gray-600'} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}>
        <FaGlobeAmericas className="w-3 h-3" />
        <span>{regionNames[game.region] || game.region}</span>
      </div>
    );
  };
  
  return (
    <a href={`/game/${game.slug}`} className="group relative">
      <div className="overflow-hidden rounded-lg border border-accent-secondary mb-2">
        <EnhancedGameCover 
          game={game} 
          width={300}
          height={200}
          className="w-full h-full"
        />
        
        {/* Badge container - positioned at top-right corner */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {/* Local game badge */}
          {isLocal && badgeSettings.showLocalBadge && (
            <div className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaDesktop className="w-3 h-3" />
              <span>Local</span>
            </div>
          )}
          
          {/* Cached image badge */}
          {isCached && badgeSettings.showCachedBadge && (
            <div className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <TbWifi className="w-3 h-3" />
              <span>Cached</span>
            </div>
          )}
          
          {/* Region badge */}
          {game.region && badgeSettings.showRegionBadge && getRegionBadge()}
          
          {/* Image source badge */}
          {badgeSettings.showImageSourceBadge && (
            <div className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <HiPhotograph className="w-3 h-3" />
              <span>{getImageSource()}</span>
            </div>
          )}
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