/**
 * TheGamesDB API utilities for fetching game metadata
 * 
 * This file provides functions to interact with TheGamesDB API
 * to retrieve game artwork, metadata, and other resources.
 */

// TheGamesDB API configuration
const TGDB_API_URL = 'https://api.thegamesdb.net/v1';
// Access the API key from environment variables
const TGDB_API_KEY = process.env.TGDB_API_KEY || '26c28c263fbe921c94dd6902a900f53e4a88df9e1ab7146d07f5ca35d1c228fc';
const TGDB_IMAGE_BASE_URL = 'https://cdn.thegamesdb.net/images/';

// Check if API key is available
const hasValidApiKey = !!TGDB_API_KEY;

// Fetch helper with timeout
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${url}`);
    }
    
    throw error;
  }
}

/**
 * Check if TheGamesDB API is accessible with the current key
 * 
 * @returns {Promise<{available: boolean, message: string}>} - API availability status
 */
export async function checkApiStatus() {
  try {
    if (!TGDB_API_KEY) {
      return { 
        available: false, 
        message: 'API key is missing or empty' 
      };
    }
    
    // Try a simple Platform List API call to check if the API key works
    const url = `${TGDB_API_URL}/Platforms?apikey=${TGDB_API_KEY}`;
    
    const response = await fetchWithTimeout(url, {}, 5000);
    
    if (!response.ok) {
      return { 
        available: false, 
        message: `API returned error status: ${response.status}` 
      };
    }
    
    const data = await response.json();
    
    if (data.code !== 200 || data.status !== 'Success') {
      return { 
        available: false, 
        message: data.status || 'Unknown API error' 
      };
    }
    
    return { 
      available: true, 
      message: 'API is available and key is valid',
      platforms: Object.keys(data.data.platforms || {}).length 
    };
  } catch (error) {
    console.error('Error checking TheGamesDB API status:', error);
    return { 
      available: false, 
      message: error.message || 'Unknown error checking API status' 
    };
  }
}

/**
 * Search for a game in TheGamesDB by name
 * 
 * @param {string} gameName - The name of the game to search for
 * @param {string} platform - The platform/console name (e.g., 'snes', 'nes')
 * @returns {Promise<Object>} - The search results
 */
export async function searchGame(gameName, platform) {
  try {
    // Check if we have a valid API key
    if (!hasValidApiKey) {
      console.warn('Missing TheGamesDB API key. Please set TGDB_API_KEY in your environment variables.');
      return null;
    }
    
    // Map EmulatorJS cores to TheGamesDB platform IDs
    const platformId = getPlatformId(platform);
    
    // Build the URL for ByGameName API endpoint
    let url = `${TGDB_API_URL}/Games/ByGameName?apikey=${TGDB_API_KEY}&name=${encodeURIComponent(gameName)}`;
    
    // Add fields to retrieve additional data
    url += `&fields=players,publishers,genres,overview,rating`;
    
    // Add platform filter if available
    if (platformId) {
      url += `&filter[platform]=${platformId}`;
    }
    
    // Include boxart and platform data
    url += `&include=boxart,platform`;
    
    console.log(`Searching TheGamesDB for game: ${gameName}, platform: ${platform}`);
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`TheGamesDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 200 || data.status !== 'Success') {
      throw new Error(`TheGamesDB API error: ${data.status || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching game data from TheGamesDB:', error);
    throw error; // Propagate the error for better handling
  }
}

/**
 * Gets the TheGamesDB platform ID for a given EmulatorJS core
 * 
 * @param {string} core - The EmulatorJS core name (snes, nes, gba, etc.)
 * @returns {number} - The corresponding TheGamesDB platform ID
 */
export function getPlatformId(core) {
  // Map EmulatorJS cores to TheGamesDB platform IDs
  const platformMap = {
    'snes': 6,       // Super Nintendo Entertainment System (SNES)
    'nes': 7,        // Nintendo Entertainment System (NES)
    'gba': 5,        // Game Boy Advance
    'gb': 9,         // Game Boy
    'gbc': 41,       // Game Boy Color
    'n64': 4,        // Nintendo 64
    'nds': 8,        // Nintendo DS
    'segaMD': 36,    // Sega Genesis/Mega Drive
    'segaCD': 21,    // Sega CD
    'segaSaturn': 17, // Sega Saturn
    'arcade': 23,    // Arcade
    'psx': 10,       // PlayStation
    'psp': 13,       // PlayStation Portable
    // Add more mappings as needed
  };
  
  return platformMap[core] || null;
}

/**
 * Fetches game images from TheGamesDB using the game ID
 * 
 * @param {number} gameId - The TheGamesDB game ID
 * @returns {Promise<Object>} - The game images data
 */
export async function getGameImages(gameId) {
  try {
    // Check if we have a valid API key
    if (!hasValidApiKey) {
      return null;
    }
    
    // Build URL for Images API endpoint
    const url = `${TGDB_API_URL}/Games/Images?apikey=${TGDB_API_KEY}&games_id=${gameId}&filter[type]=boxart,screenshot,clearlogo`;
    
    console.log(`Fetching images for game ID: ${gameId}`);
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`TheGamesDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 200 || data.status !== 'Success') {
      throw new Error(`TheGamesDB API error: ${data.status || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching game images from TheGamesDB:', error);
    throw error; // Propagate the error for better handling
  }
}

/**
 * Gets game by ID with complete metadata
 * 
 * @param {number} gameId - The TheGamesDB game ID
 * @returns {Promise<Object>} - The complete game data
 */
export async function getGameById(gameId) {
  try {
    // Check if we have a valid API key
    if (!hasValidApiKey) {
      return null;
    }
    
    // Build URL for ByGameID API endpoint
    const url = `${TGDB_API_URL}/Games/ByGameID?apikey=${TGDB_API_KEY}&id=${gameId}&fields=players,publishers,genres,overview,rating&include=boxart,platform`;
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`TheGamesDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 200 || data.status !== 'Success') {
      throw new Error(`TheGamesDB API error: ${data.status || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching game by ID from TheGamesDB:', error);
    throw error; // Propagate the error for better handling
  }
}

/**
 * Fetches game cover art from TheGamesDB
 * 
 * @param {string} gameName - The name of the game
 * @param {string} core - The EmulatorJS core being used (snes, nes, etc.)
 * @returns {Promise<string>} - The URL to the game cover image
 */
export async function getGameCoverUrl(gameName, core) {
  try {
    if (!gameName || !core) {
      throw new Error('Game name and core are required');
    }
    
    // Check if we have a valid API key
    if (!hasValidApiKey) {
      throw new Error('TheGamesDB API key is not configured');
    }
    
    // Step 1: Search for the game by name
    const searchData = await searchGame(gameName, core);
    
    if (!searchData || !searchData.data || !searchData.data.games || searchData.data.games.length === 0) {
      console.warn(`No games found for: ${gameName} on platform: ${core}`);
      return null;
    }
    
    // Get the first game result
    const game = searchData.data.games[0];
    const gameId = game.id;
    
    // Step 2: Get images for the game using its ID
    const imagesData = await getGameImages(gameId);
    
    if (!imagesData || !imagesData.data || !imagesData.data.images || !imagesData.data.images[gameId]) {
      console.warn(`No images found for game ID: ${gameId}`);
      return null;
    }
    
    const images = imagesData.data.images[gameId];
    
    // The base URL should be available in the response
    const baseUrl = imagesData.data.base_url?.original || TGDB_IMAGE_BASE_URL;
    
    // Get cover art (prefer front boxart)
    let bestImage = null;
    
    // First try to find front boxart
    const boxartFront = images.find(img => img.type === 'boxart' && img.side === 'front');
    if (boxartFront) {
      bestImage = boxartFront;
    } else {
      // Then try any boxart
      const boxart = images.find(img => img.type === 'boxart');
      if (boxart) {
        bestImage = boxart;
      } else {
        // Then try screenshots
        const screenshot = images.find(img => img.type === 'screenshot');
        if (screenshot) {
          bestImage = screenshot;
        } else {
          // Finally try clearlogo
          const clearlogo = images.find(img => img.type === 'clearlogo');
          if (clearlogo) {
            bestImage = clearlogo;
          }
        }
      }
    }
    
    // If we found a suitable image, construct the URL
    if (bestImage) {
      const coverUrl = `${baseUrl}${bestImage.filename}`;
      return coverUrl;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching game cover from TheGamesDB for ${gameName} (${core}):`, error);
    throw error; // Propagate the error for better handling upstream
  }
} 