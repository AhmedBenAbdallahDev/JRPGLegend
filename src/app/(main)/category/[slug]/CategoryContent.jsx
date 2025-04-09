'use client';

import { useState, useEffect } from 'react';
import EnhancedGameCover from '@/components/EnhancedGameCover';
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt, FaLaptop, FaFilter, FaDesktop, FaGlobeAmericas } from 'react-icons/fa';
import { TbWifi } from 'react-icons/tb';
import { HiPhotograph } from 'react-icons/hi';
import Loading from '@/components/Loading';
import { getOfflineCategories, getOfflineGamesByCore } from '@/lib/offlineGames';

// Function to get the appropriate icon for each platform category
const getCategoryIcon = (slug) => {
  const iconSize = 24;
  
  if (!slug) return <FaGamepad size={iconSize} />;
  
  // Check if this is an offline category
  if (slug.startsWith('offline-')) {
    return <FaLaptop size={iconSize} />;
  }
  
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

// Get region color
const getRegionColor = (region) => {
  const regionColors = {
    'us': 'bg-blue-600',
    'jp': 'bg-red-600',
    'eu': 'bg-yellow-600',
    'world': 'bg-green-600',
    'other': 'bg-purple-600'
  };
  
  return regionColors[region] || 'bg-gray-600';
};

// Get region name
const getRegionName = (region) => {
  const regionNames = {
    'us': 'USA',
    'jp': 'Japan',
    'eu': 'Europe',
    'world': 'World',
    'other': 'Other'
  };
  
  return regionNames[region] || region;
};

// Get image source
const getImageSource = (game) => {
  if (!game.image) return 'default';
  if (game.image.startsWith('wikimedia:')) return 'wikimedia';
  if (game.image.startsWith('tgdb:')) return 'tgdb';
  if (game.image.startsWith('screenscraper:')) return 'screenscraper';
  if (game.image.startsWith('file://')) return 'local';
  if (game.image.startsWith('app-local://')) return 'local';
  // Check if it's a regular file path (not a URL and doesn't contain special reference markers)
  if (!game.image.includes(':') && !game.image.startsWith('http')) return 'local';
  if (game.image.startsWith('http')) return 'external';
  return 'custom';
};

// Function to check if image is locally stored
const isLocalImage = (image) => {
  if (!image) return false;
  if (image.startsWith('file://')) return true;
  if (image.startsWith('app-local://')) return true;
  // Check if it's a regular file path (not a URL and doesn't contain special reference markers)
  if (!image.includes(':') && !image.startsWith('http')) return true;
  return false;
};

// Map slug to emulator core
const getEmulatorCoreFromSlug = (slug) => {
  const mapping = {
    'nes': 'nes',
    'nintendo-entertainment-system': 'nes',
    'snes': 'snes', 
    'super-nintendo': 'snes',
    'n64': 'n64',
    'nintendo-64': 'n64',
    'gb': 'gb',
    'game-boy': 'gb',
    'gbc': 'gbc',
    'game-boy-color': 'gbc',
    'gba': 'gba',
    'game-boy-advance': 'gba',
    'nds': 'nds',
    'nintendo-ds': 'nds',
    'segams': 'segaMS',
    'sega-master-system': 'segaMS',
    'genesis': 'segaMD',
    'sega-mega-drive': 'segaMD',
    'segacd': 'segaCD',
    'sega-cd': 'segaCD',
    'sega-game-gear': 'segaGG',
    'sega-32x': 'sega32x',
    'sega-saturn': 'saturn',
    'saturn': 'saturn',
    'psx': 'psx',
    'playstation': 'psx',
    'psp': 'psp',
    'arcade': 'arcade',
    'atari-2600': 'atari2600',
    'atari-lynx': 'lynx',
    'dos': 'pc',
    '3do': '3do',
    'jaguar': 'jaguar',
    'neo-geo': 'neogeo',
    'colecovision': 'coleco'
  };
  
  return mapping[slug.toLowerCase()] || null;
}

export default function CategoryContent({ 
  slug, 
  initialOnlineGames = [], 
  totalPages = 1,
  currentPage = 1,
  initialCategory = null,
  page = 1
}) {
  const [loading, setLoading] = useState(true);
  const [onlineGames, setOnlineGames] = useState(initialOnlineGames || []);
  const [offlineGames, setOfflineGames] = useState([]);
  const [displayedGames, setDisplayedGames] = useState([]);
  const [category, setCategory] = useState(initialCategory);
  const [filter, setFilter] = useState('all'); // 'all', 'online', 'offline'
  const [isSpecialOfflineCategory, setIsSpecialOfflineCategory] = useState(false);
  
  // Apply filter to games
  useEffect(() => {
    let filtered = [];
    
    if (filter === 'all') {
      filtered = [...onlineGames, ...offlineGames];
    } else if (filter === 'online') {
      filtered = [...onlineGames];
    } else if (filter === 'offline') {
      filtered = [...offlineGames];
    }
    
    setDisplayedGames(filtered);
  }, [filter, onlineGames, offlineGames]);
  
  // Load offline games
  useEffect(() => {
    async function loadOfflineData() {
      setLoading(true);
      
      try {
        // Check if this is a dedicated offline category
        if (slug.startsWith('offline-')) {
          const offlineCategories = getOfflineCategories();
          const offlineCategory = offlineCategories.find(cat => cat.slug === slug);
          
          if (offlineCategory) {
            setCategory(offlineCategory);
            setOfflineGames(offlineCategory.games || []);
            setIsSpecialOfflineCategory(true);
          } else {
            // No offline games found for this category
            setOfflineGames([]);
          }
        } else {
          // Try to find matching offline games for this category
          const emulatorCore = getEmulatorCoreFromSlug(slug);
          if (emulatorCore) {
            const matchingOfflineGames = getOfflineGamesByCore(emulatorCore);
            setOfflineGames(matchingOfflineGames || []);
          }
          
          setIsSpecialOfflineCategory(false);
        }
      } catch (error) {
        console.error('Error loading offline games:', error);
        setOfflineGames([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadOfflineData();
  }, [slug]);
  
  if (loading && !initialOnlineGames.length) {
    return <Loading />;
  }

  // Get combined count of all games
  const totalGamesCount = onlineGames.length + offlineGames.length;
  const onlineCount = onlineGames.length;
  const offlineCount = offlineGames.length;

  return(
    <div>
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h1 className='font-display text-3xl capitalize flex items-center gap-2'>
          <span className="text-accent">{getCategoryIcon(slug)}</span>
          {category?.title || slug.replace(/-/g, ' ')}
          {isSpecialOfflineCategory && <span className="text-xs bg-accent text-black px-2 py-1 rounded-full ml-2">Offline</span>}
        </h1>
        
        {/* Filter dropdown */}
        {onlineCount > 0 && offlineCount > 0 && (
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <FaFilter className="text-accent" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 text-white border border-accent-secondary rounded px-2 py-1 text-sm"
            >
              <option value="all">All games ({totalGamesCount})</option>
              <option value="online">Online only ({onlineCount})</option>
              <option value="offline">Offline only ({offlineCount})</option>
            </select>
          </div>
        )}
      </div>
      
      <nav className='rounded-md w-full mb-4'>
        <ol className='list-reset flex'>
          <li>
            <a href='/' className="hover:text-accent">Home</a>
          </li>
          <li>
            <span className='text-gray-500 mx-2'>/</span>
          </li>
          <li className='text-gray-500 capitalize flex items-center gap-1'>
            <span className="text-accent">{getCategoryIcon(slug)}</span>
            {category?.title || slug.replace(/-/g, ' ')}
            {isSpecialOfflineCategory && <span className="text-xs bg-accent/80 text-black px-2 py-0.5 rounded-full ml-1">Offline</span>}
          </li>
        </ol>
      </nav>

      {category?.description && (
        <div className="bg-main p-4 rounded-lg mb-6">
          <p className="text-gray-300">{category.description}</p>
        </div>
      )}
      
      {/* Stats about online/offline games */}
      {(onlineCount > 0 && offlineCount > 0) && (
        <div className="bg-gray-800 p-3 rounded-lg mb-6 text-sm flex flex-wrap gap-4">
          <div>
            <span className="text-accent font-medium">{totalGamesCount}</span> games total
          </div>
          <div>
            <span className="text-accent font-medium">{onlineCount}</span> online games
          </div>
          <div>
            <span className="text-accent font-medium">{offlineCount}</span> offline games
          </div>
        </div>
      )}

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
        {displayedGames.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <FaGamepad size={48} className="mx-auto text-accent mb-4" />
            <p className="text-xl">No games found in this category.</p>
            <p className="text-gray-400 mt-2">Try browsing other platforms or adding a game.</p>
          </div>
        ) : (
          displayedGames.map((game) => (
            <a href={`/game/${game.slug}`} key={game.id} className='group relative'>
              <div className='overflow-hidden rounded-lg border-accent-secondary border mb-2 relative'>
                <EnhancedGameCover 
                  game={game} 
                  width={300}
                  height={300}
                  className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                  hideInternalBadges={true}
                />
                
                {/* Badge container - positioned at top-right corner */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {/* Local game badge */}
                  {(game.isLocal || game.isOffline || isLocalImage(game.image)) && (
                    <div className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FaDesktop className="w-3 h-3" />
                      <span>Local</span>
                    </div>
                  )}
                  
                  {/* Cached image badge */}
                  {(game.image?.startsWith('http') || (game.image?.includes(':') && !game.image?.startsWith('file:'))) && (
                    <div className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <TbWifi className="w-3 h-3" />
                      <span>Cached</span>
                    </div>
                  )}
                  
                  {/* Region badge */}
                  {game.region && (
                    <div className={`${getRegionColor(game.region)} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}>
                      <FaGlobeAmericas className="w-3 h-3" />
                      <span>{getRegionName(game.region)}</span>
                    </div>
                  )}
                  
                  {/* Image source badge */}
                  <div className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <HiPhotograph className="w-3 h-3" />
                    <span>{getImageSource(game)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-accent">
                <span>{getCategoryIcon(game?.categorySlug || (category?.slug || slug))}</span>
                <p>{category?.title || slug.replace(/-/g, ' ')}</p>
              </div>
              <h1 className="font-medium">{game.title}</h1>
            </a>
          ))
        )}
      </div>

      {!isSpecialOfflineCategory && onlineGames.length > 0 && totalPages > 1 && (
        <div className='flex justify-center mt-8'>
          <nav className='inline-flex rounded-md shadow'>
            {currentPage > 1 && (
              <a href={`/category/${slug}?page=${currentPage - 1}`}
              className='px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50'>
                Previous
              </a>
            )}
            {[...Array(totalPages).keys()].map((pageNum) => (
              <a href={`/category/${slug}?page=${pageNum + 1}`}
              key={pageNum + 1}
              className={`px-3 py-2 border border-gray-300 bg-white text-sm font-medium ${
                currentPage === pageNum + 1
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {pageNum + 1}
              </a>
            ))}

            {currentPage < totalPages && (
              <a href={`/category/${slug}?page=${currentPage + 1}`}
              className='px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium 
              text-gray-500 hover:bg-gray-50'>
                Next
              </a>
            )}
          </nav>
        </div>
      )}
    </div>
  );
} 