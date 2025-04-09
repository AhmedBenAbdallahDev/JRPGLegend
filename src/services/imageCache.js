/**
 * ImageCache Service
 * 
 * Centralizes all image caching functionality to make it consistent across the application.
 */

// In-memory cache for the current session
const memoryCache = new Map();

// Default image if nothing else is available
export const DEFAULT_IMAGE = '/game/default-image.png';

// Backup default if even that fails
export const HARDCODED_DEFAULT = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmQzMjM4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmYTUwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+R2FtZSBDb3ZlcjwvdGV4dD48L3N2Zz4=';

/**
 * Get an image from the in-memory cache
 * 
 * @param {string} key - Cache key
 * @returns {string|null} - The cached URL or null if not found
 */
export function getFromMemoryCache(key) {
  return memoryCache.has(key) ? memoryCache.get(key) : null;
}

/**
 * Store an image in the in-memory cache
 * 
 * @param {string} key - Cache key
 * @param {string} url - Image URL to cache
 */
export function setInMemoryCache(key, url) {
  memoryCache.set(key, url);
}

/**
 * Get an image from localStorage cache
 * 
 * @param {string} key - Cache key
 * @returns {string|null} - The cached URL or null if not found
 */
export function getFromLocalStorageCache(key) {
  try {
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(`cover_${key}`);
      if (cachedData) {
        const { url } = JSON.parse(cachedData);
        return url;
      }
    }
    return null;
  } catch (err) {
    console.error('[ImageCache] Error reading from localStorage:', err);
    return null;
  }
}

/**
 * Store an image in localStorage cache
 * 
 * @param {string} key - Cache key
 * @param {string} url - Image URL to cache
 * @param {Object} [metadata] - Optional metadata to store with the image
 */
export function saveToLocalStorageCache(key, url, metadata = {}) {
  try {
    if (typeof window !== 'undefined') {
      const data = {
        url,
        timestamp: Date.now(),
        ...metadata
      };
      localStorage.setItem(`cover_${key}`, JSON.stringify(data));
      
      // Also update in-memory cache
      memoryCache.set(key, url);
    }
  } catch (err) {
    console.error('[ImageCache] Error saving to localStorage:', err);
  }
}

/**
 * Check if an image exists in any cache
 * 
 * @param {string} key - Cache key to check
 * @returns {string|null} - The cached URL or null if not found
 */
export function checkCache(key) {
  // First check memory cache (faster)
  const memoryResult = getFromMemoryCache(key);
  if (memoryResult) return memoryResult;
  
  // Then check localStorage
  const localStorageResult = getFromLocalStorageCache(key);
  if (localStorageResult) {
    // Update memory cache for next time
    setInMemoryCache(key, localStorageResult);
    return localStorageResult;
  }
  
  return null;
}

/**
 * Check if the image URL for a game is cached
 * 
 * @param {Object} game - Game object 
 * @param {string} [source='wikimedia'] - Source preference
 * @returns {boolean} - Whether the image is cached
 */
export function isImageCached(game, source = 'wikimedia') {
  if (!game) return false;
  
  // Generate all possible cache keys for this game
  const possibleKeys = [];
  
  // 1. If game has image field
  if (game.image) {
    // Direct URL
    if (game.image.startsWith('http')) {
      possibleKeys.push(`web-url:${game.image}`);
    }
    
    // API reference
    if (game.image.startsWith('wikimedia:') || 
        game.image.startsWith('tgdb:') || 
        game.image.startsWith('screenscraper:')) {
      possibleKeys.push(game.image);
    }
    
    // Cache reference
    if (game.image.startsWith('cache:')) {
      return true;
    }
  }
  
  // 2. If game has title and core fields
  if (game.title && game.core) {
    possibleKeys.push(`${source}:${game.title}:${game.core}`);
    
    // Also check other potential sources
    if (source !== 'wikimedia') possibleKeys.push(`wikimedia:${game.title}:${game.core}`);
    if (source !== 'tgdb') possibleKeys.push(`tgdb:${game.title}:${game.core}`);
    if (source !== 'screenscraper') possibleKeys.push(`screenscraper:${game.title}:${game.core}`);
  }
  
  // Check if any key exists in cache
  for (const key of possibleKeys) {
    if (checkCache(key)) return true;
  }
  
  return false;
}

/**
 * Create a cache key for a game
 * 
 * @param {Object} game - Game object
 * @param {string} source - Image source
 * @returns {string} - Cache key
 */
export function createCacheKey(game, source) {
  if (game.image) {
    if (game.image.startsWith('http')) {
      return `web-url:${game.image}`;
    }
    
    if (game.image.startsWith('wikimedia:') || 
        game.image.startsWith('tgdb:') || 
        game.image.startsWith('screenscraper:')) {
      return game.image;
    }
  }
  
  if (game.title && game.core) {
    return `${source}:${game.title}:${game.core}`;
  }
  
  return null;
}

/**
 * Get all cached covers from localStorage
 * 
 * @returns {Array} - Array of cached cover objects
 */
export function getAllCachedCovers() {
  try {
    if (typeof window !== 'undefined') {
      const covers = [];
      
      // Iterate through localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('cover_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            let source, gameName, console;
            
            // Handle the different key formats
            if (key.startsWith('cover_web-url:')) {
              // Web URL format: cover_web-url:http://example.com/image.jpg
              source = 'web-url';
              gameName = 'Unknown';
              console = 'unknown';
              
              // Try to extract the domain from the URL
              try {
                const url = new URL(item.url);
                gameName = url.hostname;
              } catch (urlErr) {
                console.log("Could not parse URL domain:", urlErr);
              }
            } else {
              // Normal format: cover_source:gameName:console
              [source, gameName, console] = key.replace('cover_', '').split(':');
              gameName = decodeURIComponent(gameName || '');
            }
            
            covers.push({
              key,
              gameName: gameName || 'Unknown',
              console: console || 'unknown',
              date: new Date(item.timestamp).toLocaleDateString(),
              url: item.url,
              source: source || 'unknown'
            });
          } catch (err) {
            console.error("Error parsing cache item:", err);
          }
        }
      }
      
      // Sort by most recent first
      covers.sort((a, b) => new Date(b.date) - new Date(a.date));
      return covers;
    }
    return [];
  } catch (err) {
    console.error("Error loading cached covers:", err);
    return [];
  }
}

export default {
  getFromMemoryCache,
  setInMemoryCache,
  getFromLocalStorageCache,
  saveToLocalStorageCache,
  checkCache,
  isImageCached,
  createCacheKey,
  getAllCachedCovers,
  DEFAULT_IMAGE,
  HARDCODED_DEFAULT
}; 