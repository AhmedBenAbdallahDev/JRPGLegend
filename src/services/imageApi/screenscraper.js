/**
 * ScreenScraper API Service
 * 
 * Handles all interactions with ScreenScraper API for fetching game cover images.
 */
import ImageCache from '../imageCache';

/**
 * Fetch a game cover image from ScreenScraper
 * 
 * @param {Object|string} gameOrTitle - Either a game object or game title
 * @param {string} [core] - Game system/core (required if gameOrTitle is string)
 * @returns {Promise<{url: string, source: string, fromCache: boolean}>} - Image result
 */
export async function fetchCover(gameOrTitle, core) {
  // Handle different parameter types
  let gameTitle, gameCore;
  
  if (typeof gameOrTitle === 'object') {
    // It's a game object
    const game = gameOrTitle;
    
    // Special case for screenscraper: reference
    if (game.image && game.image.startsWith('screenscraper:')) {
      const parts = game.image.split(':');
      if (parts.length >= 2) {
        gameTitle = decodeURIComponent(parts[1]);
        gameCore = game.core;
      } else {
        gameTitle = game.title;
        gameCore = game.core;
      }
    } else {
      gameTitle = game.title;
      gameCore = game.core;
    }
  } else {
    // It's a string (title)
    gameTitle = gameOrTitle;
    gameCore = core;
  }
  
  if (!gameTitle || !gameCore) {
    throw new Error('Missing game title or core');
  }

  console.log(`[ScreenScraperAPI] Fetching cover for ${gameTitle} (${gameCore})`);

  // Generate cache key
  const cacheKey = `screenscraper:${gameTitle}:${gameCore}`;
  
  // Check cache first
  const cachedUrl = ImageCache.checkCache(cacheKey);
  if (cachedUrl) {
    console.log(`[ScreenScraperAPI] Using cached image for ${gameTitle}`);
    return {
      url: cachedUrl,
      source: 'screenscraper',
      fromCache: true
    };
  }

  try {
    // Map core names to ScreenScraper platform IDs
    const platformMap = {
      'gba': 12,           // Game Boy Advance
      'snes': 3,           // Super Nintendo
      'nes': 2,            // Nintendo Entertainment System
      'n64': 14,           // Nintendo 64
      'gb': 9,             // Game Boy
      'gbc': 10,           // Game Boy Color
      'psx': 57,           // PlayStation
      'ps2': 58,           // PlayStation 2
      'psp': 61,           // PlayStation Portable
      'genesis': 1,        // Sega Genesis/Mega Drive
      'segacd': 20,        // Sega CD
      'saturn': 22,        // Sega Saturn
      'nds': 24,           // Nintendo DS
      '3ds': 17,           // Nintendo 3DS
      'wii': 16,           // Nintendo Wii
      'wiiu': 18,          // Nintendo Wii U
      'switch': 27,        // Nintendo Switch
      'pc': 135,           // PC
      'dreamcast': 23,     // Sega Dreamcast
      'ps3': 59,           // PlayStation 3
      'ps4': 60,           // PlayStation 4
      'ps5': 251,          // PlayStation 5
      'xbox': 32,          // Xbox
      'xbox360': 33,       // Xbox 360
      'xboxone': 34,       // Xbox One
      'xboxseries': 247,   // Xbox Series X/S
    };
    
    // Convert core name to platform ID
    const platformId = platformMap[gameCore.toLowerCase()];
    if (!platformId) {
      console.warn(`[ScreenScraperAPI] No mapping for platform ${gameCore}, using general search`);
    }
    
    // Use the ScreenScraper API to search for the game
    console.log(`[ScreenScraperAPI] Searching for game "${gameTitle}" on platform ${platformId || 'any'}`);
    
    // Construct the API URL with platform ID if available
    let apiUrl = `/api/screenscraper?name=${encodeURIComponent(gameTitle)}`;
    if (platformId) {
      apiUrl += `&platform=${platformId}`;
    }
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`ScreenScraper API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.games || data.games.length === 0) {
      throw new Error('No games found from ScreenScraper');
    }
    
    console.log(`[ScreenScraperAPI] Found ${data.games.length} potential matches`);
    
    // Find the game with the closest title match
    const closestMatch = data.games.find(game => {
      const normalizedTitle = game.name.toLowerCase();
      const normalizedSearchTitle = gameTitle.toLowerCase();
      
      // First try exact match
      if (normalizedTitle === normalizedSearchTitle) return true;
      
      // Then try contains
      if (normalizedTitle.includes(normalizedSearchTitle) || normalizedSearchTitle.includes(normalizedTitle)) return true;
      
      // Then try with special characters and spaces removed
      const cleanTitle = normalizedTitle.replace(/[^a-z0-9]/g, '');
      const cleanSearchTitle = normalizedSearchTitle.replace(/[^a-z0-9]/g, '');
      
      if (cleanTitle === cleanSearchTitle) return true;
      if (cleanTitle.includes(cleanSearchTitle) || cleanSearchTitle.includes(cleanTitle)) return true;
      
      return false;
    }) || data.games[0]; // Fall back to first result if no good match
    
    console.log(`[ScreenScraperAPI] Selected game "${closestMatch.name}" (ID: ${closestMatch.id})`);
    
    // Check if the game has a box art image
    if (closestMatch.boxart) {
      console.log(`[ScreenScraperAPI] Found boxart: ${closestMatch.boxart}`);
      
      // Cache the result
      ImageCache.saveToLocalStorageCache(
        cacheKey, 
        closestMatch.boxart, 
        { title: closestMatch.name, source: 'screenscraper' }
      );
      
      return {
        url: closestMatch.boxart,
        source: 'screenscraper',
        fromCache: false
      };
    }
    
    throw new Error('No boxart image found for this game');
    
  } catch (err) {
    console.error('[ScreenScraperAPI] Error fetching image:', err.message);
    throw err;
  }
}

/**
 * Handle special screenscraper: reference
 * 
 * @param {string} reference - The 'screenscraper:' reference
 * @param {Object} game - Game object to use for additional context
 * @returns {Promise<{url: string, source: string, fromCache: boolean}>} - Image result
 */
export async function handleReference(reference, game) {
  try {
    // Check if it includes a game ID
    if (reference.match(/screenscraper:\d+/)) {
      const gameId = reference.split(':')[1];
      console.log(`[ScreenScraperAPI] Handling screenscraper reference with game ID: ${gameId}`);
      
      // Use the reference as cache key first
      const cachedUrl = ImageCache.checkCache(reference);
      if (cachedUrl) {
        console.log(`[ScreenScraperAPI] Found cached URL for reference: ${reference}`);
        return {
          url: cachedUrl,
          source: 'screenscraper',
          fromCache: true
        };
      }
      
      // Fetch game details by ID
      const response = await fetch(`/api/screenscraper?id=${gameId}`);
      if (!response.ok) {
        throw new Error(`ScreenScraper API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success || !data.game) {
        throw new Error('Game not found by ID');
      }
      
      const gameData = data.game;
      if (gameData.boxart) {
        console.log(`[ScreenScraperAPI] Found boxart for game ID ${gameId}: ${gameData.boxart}`);
        
        // Cache the result
        ImageCache.saveToLocalStorageCache(
          reference, 
          gameData.boxart, 
          { title: gameData.name, source: 'screenscraper' }
        );
        
        return {
          url: gameData.boxart,
          source: 'screenscraper',
          fromCache: false
        };
      }
      
      throw new Error('No boxart found for this game ID');
    } else {
      // Handle as a title reference
      const parts = reference.split(':');
      if (parts.length >= 2) {
        const title = decodeURIComponent(parts[1]);
        return fetchCover(title, game.core);
      } else {
        throw new Error('Invalid screenscraper reference format');
      }
    }
  } catch (err) {
    console.error('[ScreenScraperAPI] Error handling reference:', err.message);
    throw err;
  }
}

export default {
  fetchCover,
  handleReference
}; 