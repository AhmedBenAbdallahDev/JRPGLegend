"use client";

import { FaDesktop, FaGlobeAmericas } from 'react-icons/fa';
import { HiPhotograph } from 'react-icons/hi';
import { TbWifi } from 'react-icons/tb';
import { useSettings } from "@/context/SettingsContext";
import { useState, useEffect } from 'react';

// Region color mapping
export const getRegionColor = (region) => {
  if (region === null || region === undefined || region === '') 
    return 'bg-blue-600';
    
  const regionColors = {
    'us': 'bg-blue-600',
    'jp': 'bg-red-600',
    'eu': 'bg-yellow-600',
    'world': 'bg-green-600',
    'other': 'bg-purple-600'
  };
  
  return regionColors[region] || 'bg-gray-600';
};

// Region name mapping
export const getRegionName = (region) => {
  if (region === null || region === undefined || region === '') 
    return 'No Region';
    
  const regionNames = {
    'us': 'USA',
    'jp': 'Japan',
    'eu': 'Europe',
    'world': 'World',
    'other': 'Other'
  };
  
  return regionNames[region] || region;
};

// Get original image source, regardless of caching
export const getImageSource = (game) => {
  if (!game?.image) return 'default';
  
  // Direct source identifiers (these preserve the original source)
  if (game.image.startsWith('wikimedia:')) return 'wikimedia';
  if (game.image.startsWith('tgdb:')) return 'tgdb';
  if (game.image.startsWith('screenscraper:')) return 'screenscraper';
  
  // Local file identifiers
  if (game.image.startsWith('file://')) return 'local';
  if (game.image.startsWith('app-local://')) return 'local';
  
  // Other identifiable types
  if (game.image.startsWith('data:image')) return 'embedded';
  
  // Check for cache keys that might indicate original source
  const cachePrefix = 'cache:';
  if (game.image.startsWith(cachePrefix)) {
    const sourceInfo = game.image.substring(cachePrefix.length);
    
    if (sourceInfo.includes('wikimedia')) return 'wikimedia';
    if (sourceInfo.includes('tgdb')) return 'tgdb';
    if (sourceInfo.includes('screenscraper')) return 'screenscraper';
    if (sourceInfo.includes('web-url')) return 'web-url';
  }
  
  // Regular file path (not a URL and doesn't contain special reference markers)
  if (!game.image.includes(':') && !game.image.startsWith('http')) return 'local';
  
  // Web URLs
  if (game.image.startsWith('http')) return 'web-url';
  
  return 'custom';
};

// Function to check if image is locally stored
export const isLocalImage = (image) => {
  if (!image) return false;
  if (image.startsWith('file://')) return true;
  if (image.startsWith('app-local://')) return true;
  if (image.startsWith('client-storage://')) return true;
  // Check if it's a regular file path (not a URL and doesn't contain special reference markers)
  if (!image.includes(':') && !image.startsWith('http')) return true;
  return false;
};

// Improved function to check if an image is actually loaded from cache
export const isImageCached = (game) => {
  if (!game?.image) return false;
  
  // Check for explicit cache prefix
  if (game.image.startsWith('cache:')) return true;
  
  return false;
};

// Helper function to check cache directly and identify potential issues
export const debugCacheStatus = (game) => {
  if (!game?.image) return { cached: false, reason: 'No image property' };
  
  // Direct check using explicit cache: prefix
  if (game.image.startsWith('cache:')) return { cached: true, reason: 'Explicit cache: prefix' };
  
  // Skip local images - they are direct links
  if (isLocalImage(game.image)) return { cached: false, reason: 'Local image' };
  
  // Skip data URLs
  if (game.image.startsWith('data:')) return { cached: false, reason: 'Data URL' };
  
  // Generate cache keys
  const cacheKeys = [];
  
  // Direct URL
  if (game.image.startsWith('http')) {
    cacheKeys.push(`cover_web-url:${game.image}`);
  }
  
  // API reference
  if (game.image.startsWith('wikimedia:') || 
      game.image.startsWith('tgdb:') || 
      game.image.startsWith('screenscraper:')) {
    cacheKeys.push(`cover_${game.image}`);
  }
  
  // Title-based keys
  if (game.title) {
    const encodedTitle = encodeURIComponent(game.title);
    
    // Add keys for all source types
    ['wikimedia', 'tgdb', 'screenscraper', 'auto'].forEach(source => {
      cacheKeys.push(`cover_${source}:${encodedTitle}`);
      
      // With platform/category/core
      if (game.platform) {
        cacheKeys.push(`cover_${source}:${encodedTitle}:${encodeURIComponent(game.platform)}`);
      }
      if (game.categorySlug) {
        cacheKeys.push(`cover_${source}:${encodedTitle}:${encodeURIComponent(game.categorySlug)}`);
      }
      if (game.core) {
        cacheKeys.push(`cover_${source}:${encodedTitle}:${encodeURIComponent(game.core)}`);
      }
    });
  }
  
  // Check all keys
  try {
    if (typeof localStorage !== 'undefined') {
      for (const key of cacheKeys) {
        if (localStorage.getItem(key)) {
          return { cached: true, reason: `Found exact match: ${key}`, matchedKey: key };
        }
      }
      
      // Fallback - broader search for the title
      if (game.title) {
        const plainTitle = game.title.toLowerCase();
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cover_')) {
            if (key.toLowerCase().includes(plainTitle) || 
                key.includes(encodeURIComponent(game.title))) {
              return { cached: true, reason: `Found via fallback search: ${key}`, matchedKey: key };
            }
          }
        }
      }
      
      return { cached: false, reason: 'No matching cache entry found', checkedKeys: cacheKeys };
    }
  } catch (error) {
    return { cached: false, reason: `Error: ${error.message}` };
  }
  
  return { cached: false, reason: 'Default: not cached' };
};

// Direct diagnostic function to check cover_* keys in localStorage
export const inspectCacheEntries = () => {
  const results = {
    totalEntries: 0,
    coverEntries: 0,
    coverEntriesList: []
  };
  
  try {
    if (typeof localStorage !== 'undefined') {
      results.totalEntries = localStorage.length;
      
      // Get all cover_ entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cover_')) {
          results.coverEntries++;
          
          try {
            const data = JSON.parse(localStorage.getItem(key));
            results.coverEntriesList.push({
              key,
              url: data.url ? (data.url.substring(0, 50) + '...') : 'No URL',
              timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : 'No timestamp'
            });
          } catch (e) {
            results.coverEntriesList.push({
              key, 
              error: `Could not parse: ${e.message}`
            });
          }
        }
      }
    }
  } catch (error) {
    results.error = error.message;
  }
  
  return results;
};

// Helper function to check if client-side storage is available
export const checkLocalStorageCapability = () => {
  const storageTypes = {
    indexedDB: typeof window !== 'undefined' && window.indexedDB,
    localStorage: typeof window !== 'undefined' && window.localStorage,
    fileSystem: typeof window !== 'undefined' && window.requestFileSystem
  };
  
  return {
    hasStorage: !!(storageTypes.indexedDB || storageTypes.localStorage),
    supportsLargeFiles: !!storageTypes.indexedDB,
    storageTypes
  };
};

// Generate a local storage path for game files
export const getClientStoragePath = (gameTitle, fileType = 'rom') => {
  if (typeof window === 'undefined') return null;
  
  // Create a safe filename
  const safeTitle = gameTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  // We can't write to server, but we can prepare a client-side storage reference
  // For example: "client-storage://roms/chrono_trigger.sfc"
  return `client-storage://${fileType}s/${safeTitle}`;
};

export default function GameBadges({ game }) {
  const { badgeSettings } = useSettings();
  const [isCached, setIsCached] = useState(false);
  const [isFresh, setIsFresh] = useState(false);
  
  // Check if game is local
  const isLocal = game?.isLocal || game?.isOffline || isLocalImage(game?.image) || false;
  
  // This effect runs after the component has mounted to check for badges from EnhancedGameCover
  useEffect(() => {
    // Only run this check if we have a game title
    if (game?.title) {
      try {
        // Find our parent element (the badge container)
        const cachedBadgeEl = document.querySelector(`[data-game-title="${game.title}"] .bg-green-500`);
        if (cachedBadgeEl) {
          console.log(`[Badge PARENT CHECK] Found existing cache badge in parent for ${game.title}`);
          setIsCached(true);
        }
        
        // Check for fresh badge
        const freshBadgeEl = document.querySelector(`[data-game-title="${game.title}"] .bg-pink-500`);
        if (freshBadgeEl) {
          console.log(`[Badge PARENT CHECK] Found fresh badge in parent for ${game.title}`);
          setIsFresh(true);
        }
      } catch (err) {
        console.error('[Badge PARENT CHECK] Error checking parent components:', err);
      }
    }
  }, [game?.title]);
  
  // Effect to check if the image URL is in localStorage cache
  useEffect(() => {
    // Debug log: Starting check with game info
    console.log(`[Badge DEBUG] Checking cache for game:`, { 
      title: game?.title || 'Unknown',
      image: game?.image || 'No image',
      isLocal,
      platform: game?.platform,
      categorySlug: game?.categorySlug,
      core: game?.core
    });
    
    if (!game) {
      console.log(`[Badge DEBUG] No game object - badge will NOT show`);
      setIsCached(false);
      return;
    }

    // THIS IS KEY: We need to watch for the image property to be updated
    // after the component has already mounted. Many times the image is loaded
    // asynchronously and wasn't available during initial mount.
    
    if (!game?.image) {
      console.log(`[Badge DEBUG] No image to check for cache - badge will NOT show`);
      setIsCached(false);
      return;
    }
    
    // Skip check for already-determined cache status
    if (game.image.startsWith('cache:')) {
      console.log(`[Badge DEBUG] Image starts with cache: prefix - badge WILL show`);
      setIsCached(true);
      return;
    }
    
    // IMPORTANT: Now match EnhancedGameCover's determination of what "cached" means:
    // In EnhancedGameCover.jsx, isFromCache is determined like this:
    // const [isFromCache, setIsFromCache] = useState(!!getInitialImage() && 
    //  (getInitialImage()?.startsWith('http') || (getInitialImage()?.includes(':') && !getInitialImage()?.startsWith('file:'))));
    
    // So an image is considered cached if:
    // 1. It exists
    // 2. AND EITHER:
    //    a. It starts with http (external URL)
    //    b. OR it includes ':' but doesn't start with 'file:' (API reference)
    
    // Apply the EnhancedGameCover definition of what "cached" means
    if (game.image && 
        (game.image.startsWith('http') || 
         (game.image.includes(':') && !game.image.startsWith('file:') && !game.image.startsWith('data:')))) {
      // These image types are considered cached by EnhancedGameCover
      console.log(`[Badge DEBUG] Image matches EnhancedGameCover cache criteria: ${game.image}`);
      setIsCached(true);
      return;
    }
    
    // Skip local files according to EnhancedGameCover logic
    if (isLocalImage(game.image)) {
      console.log(`[Badge DEBUG] Local image will NEVER show cache badge: ${game.image}`);
      setIsCached(false);
      return;
    }
    
    // Skip data URLs
    if (game.image.startsWith('data:')) {
      console.log(`[Badge DEBUG] Data URL will NEVER show cache badge`);
      setIsCached(false);
      return;
    }
    
    // For any other image type, check the localStorage cache
    const checkCache = () => {
      try {
        // If we got here, use the following cache keys to search
        const cacheKeys = [];
        
        // If game has title, check various source formats
        if (game.title) {
          const encodedTitle = encodeURIComponent(game.title);
          
          // Check for API source caching in the Cover Manager format
          ['wikimedia', 'tgdb', 'screenscraper', 'auto'].forEach(source => {
            cacheKeys.push(`cover_${source}:${encodedTitle}`);
            
            // With platform/category/core if available
            if (game.platform) {
              cacheKeys.push(`cover_${source}:${encodedTitle}:${encodeURIComponent(game.platform)}`);
            }
            if (game.categorySlug) {
              cacheKeys.push(`cover_${source}:${encodedTitle}:${encodeURIComponent(game.categorySlug)}`);
            }
            if (game.core) {
              cacheKeys.push(`cover_${source}:${encodedTitle}:${encodeURIComponent(game.core)}`);
            }
          });
          
          // EMERGENCY CHECK: Directly look for any key containing this game title
          // This helps when the normal patterns don't match
          if (typeof localStorage !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('cover_')) {
                // Check if key contains either the encoded or plain title
                if (key.includes(encodedTitle) || key.toLowerCase().includes(game.title.toLowerCase())) {
                  console.log(`[Badge EMERGENCY] Found cache via direct title search: ${key}`);
                  setIsCached(true);
                  return;
                }
              }
            }
          }
        }
        
        console.log(`[Badge DEBUG] Checking ${cacheKeys.length} localStorage cache keys`);
        
        // Check all potential keys exactly as stored in localStorage
        for (const key of cacheKeys) {
          const item = localStorage.getItem(key);
          if (item) {
            console.log(`[Badge DEBUG] CACHE HIT! Found cached image: ${key}`);
            console.log(`[Badge DEBUG] Cache value: ${item.substring(0, 100)}...`);
            setIsCached(true);
            return;
          }
        }
        
        console.log(`[Badge DEBUG] Final result: NOT cached in localStorage - badge will NOT show`);
        setIsCached(false);
      } catch (err) {
        console.error('[Badge DEBUG] Error checking cache:', err);
        setIsCached(false);
      }
    };
    
    checkCache();
  }, [game, game?.image]); // Add game.image as a separate dependency to ensure re-running when it changes
  
  // Notify when badge state changes - useful for debugging
  useEffect(() => {
    console.log(`[Badge DEBUG] Badge state for ${game?.title || 'Unknown'}: isCached=${isCached}, will display=${isCached && badgeSettings.showNetworkBadges}`);
  }, [isCached, badgeSettings.showNetworkBadges, game?.title]);
  
  // Direct debug log - run once on mount
  useEffect(() => {
    if (game?.title) {
      console.log(`[Badge DIRECT CHECK] Direct cache check for ${game.title}:`, debugCacheStatus(game));
      
      // Only inspect cache entries for the first game to avoid console spam
      if (game.title.toLowerCase().includes('final fantasy') || game.title.toLowerCase().includes('dragon quest')) {
        const inspectionResults = inspectCacheEntries();
        console.log(`[Badge CACHE INSPECTION] Cache inspection results:`, inspectionResults);
      }
    }
  }, [game?.title, game?.image]);
  
  return (
    <div className="flex flex-col gap-1 items-end">
      {/* Only show either fresh or cached badge, not both */}
      {isFresh && badgeSettings.showNetworkBadges && !isCached && (
        <span className="flex items-center justify-center px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs">
          <TbWifi className="mr-0.5" size={12} />
          Fresh
        </span>
      )}
      
      {/* Local game badge */}
      {isLocal && badgeSettings.showLocalBadges && (
        <span className="flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs">
          <FaDesktop className="mr-0.5" size={12} />
          Local
        </span>
      )}
      
      {/* Region badge */}
      {badgeSettings.showRegionBadges && (
        <span className={`flex items-center justify-center px-2 py-0.5 rounded-full ${getRegionColor(game?.region)} text-white text-xs`}>
          <FaGlobeAmericas className="mr-0.5" size={12} />
          {getRegionName(game?.region)}
        </span>
      )}
      
      {/* Image source badge */}
      {badgeSettings.showImageSourceBadges && (
        <span className="flex items-center justify-center px-2 py-0.5 rounded-full bg-purple-600 text-white text-xs">
          <HiPhotograph className="mr-0.5" size={12} />
          <span>{getImageSource(game)}</span>
        </span>
      )}
    </div>
  );
} 