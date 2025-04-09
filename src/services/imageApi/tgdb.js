/**
 * TheGamesDB API Service
 * 
 * Handles all interactions with TheGamesDB API for fetching game cover images.
 */
import ImageCache from '../imageCache';

/**
 * Fetch a game cover image from TheGamesDB
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
    
    // Special case for tgdb: reference
    if (game.image && game.image.startsWith('tgdb:')) {
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

  console.log(`[TGDBAPI] Fetching cover for ${gameTitle} (${gameCore})`);

  // Generate cache key
  const cacheKey = `tgdb:${gameTitle}:${gameCore}`;
  
  // Check cache first
  const cachedUrl = ImageCache.checkCache(cacheKey);
  if (cachedUrl) {
    console.log(`[TGDBAPI] Using cached image for ${gameTitle}`);
    return {
      url: cachedUrl,
      source: 'tgdb',
      fromCache: true
    };
  }

  try {
    // Map core names to TGDB platform IDs (will be expanded as needed)
    const platformMap = {
      'gba': 5,           // Game Boy Advance
      'snes': 6,          // Super Nintendo
      'nes': 7,           // Nintendo Entertainment System
      'n64': 8,           // Nintendo 64
      'gb': 9,            // Game Boy
      'gbc': 10,          // Game Boy Color
      'psx': 11,          // PlayStation
      'ps2': 12,          // PlayStation 2
      'psp': 13,          // PlayStation Portable
      'genesis': 18,      // Sega Genesis/Mega Drive
      'segacd': 20,       // Sega CD
      'saturn': 21,       // Sega Saturn
      'nds': 24,          // Nintendo DS
      '3ds': 25,          // Nintendo 3DS
      'wii': 27,          // Nintendo Wii
      'wiiu': 28,         // Nintendo Wii U
      'switch': 29,       // Nintendo Switch
      'pc': 94,           // PC
      'dreamcast': 34,    // Sega Dreamcast
      'ps3': 35,          // PlayStation 3
      'ps4': 36,          // PlayStation 4
      'ps5': 37,          // PlayStation 5
      'xbox': 38,         // Xbox
      'xbox360': 39,      // Xbox 360
      'xboxone': 40,      // Xbox One
      'xboxseries': 41,   // Xbox Series X/S
    };
    
    // Convert core name to platform ID
    const platformId = platformMap[gameCore.toLowerCase()];
    if (!platformId) {
      console.warn(`[TGDBAPI] No mapping for platform ${gameCore}, using general search`);
    }
    
    // Use the TGDB API to search for the game
    console.log(`[TGDBAPI] Searching for game "${gameTitle}" on platform ${platformId || 'any'}`);
    
    // Construct the URL with platform ID if available
    const apiUrl = `/api/tgdb?name=${encodeURIComponent(gameTitle)}${platformId ? `&platform=${platformId}` : ''}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`TGDB API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[TGDBAPI] Search results:`, data.success ? `Found ${data.games?.length || 0} games` : 'No results');
    
    if (!data.success || !data.games || data.games.length === 0) {
      throw new Error('No games found from TGDB');
    }
    
    // Find the game with the closest title match
    const closestMatch = data.games.find(game => {
      const normalizedTitle = game.title.toLowerCase();
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
    
    console.log(`[TGDBAPI] Selected game "${closestMatch.title}" (ID: ${closestMatch.id})`);
    
    // Check if the game has a box art image
    if (closestMatch.boxart) {
      console.log(`[TGDBAPI] Found boxart: ${closestMatch.boxart}`);
      
      // Cache the result
      ImageCache.saveToLocalStorageCache(
        cacheKey, 
        closestMatch.boxart, 
        { title: closestMatch.title, source: 'tgdb' }
      );
      
      return {
        url: closestMatch.boxart,
        source: 'tgdb',
        fromCache: false
      };
    }
    
    throw new Error('No boxart image found for this game');
    
  } catch (err) {
    console.error('[TGDBAPI] Error fetching image:', err.message);
    throw err;
  }
}

/**
 * Handle special tgdb: reference
 * 
 * @param {string} reference - The 'tgdb:' reference
 * @param {Object} game - Game object to use for additional context
 * @returns {Promise<{url: string, source: string, fromCache: boolean}>} - Image result
 */
export async function handleReference(reference, game) {
  try {
    // Check if it includes a game ID
    if (reference.match(/tgdb:\d+/)) {
      const gameId = reference.split(':')[1];
      console.log(`[TGDBAPI] Handling tgdb reference with game ID: ${gameId}`);
      
      // Use the reference as cache key first
      const cachedUrl = ImageCache.checkCache(reference);
      if (cachedUrl) {
        console.log(`[TGDBAPI] Found cached URL for reference: ${reference}`);
        return {
          url: cachedUrl,
          source: 'tgdb',
          fromCache: true
        };
      }
      
      // Fetch game details by ID
      const response = await fetch(`/api/tgdb?id=${gameId}`);
      if (!response.ok) {
        throw new Error(`TGDB API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success || !data.games || data.games.length === 0) {
        throw new Error('Game not found by ID');
      }
      
      const gameData = data.games[0];
      if (gameData.boxart) {
        console.log(`[TGDBAPI] Found boxart for game ID ${gameId}: ${gameData.boxart}`);
        
        // Cache the result
        ImageCache.saveToLocalStorageCache(
          reference, 
          gameData.boxart, 
          { title: gameData.title, source: 'tgdb' }
        );
        
        return {
          url: gameData.boxart,
          source: 'tgdb',
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
        throw new Error('Invalid tgdb reference format');
      }
    }
  } catch (err) {
    console.error('[TGDBAPI] Error handling reference:', err.message);
    throw err;
  }
}

export default {
  fetchCover,
  handleReference
}; 