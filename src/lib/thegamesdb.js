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

/**
 * Helper function to detect if running in a server environment
 */
const isServer = typeof window === 'undefined';

/**
 * Detailed logging function that only logs on server-side
 * @param {string} context - The context or function name
 * @param {string} message - The log message
 * @param {any} data - Optional data to log
 * @param {boolean} isError - Whether this is an error log
 */
function logTGDB(context, message, data = null, isError = false) {
  if (isServer) {
    const timestamp = new Date().toISOString();
    const logMethod = isError ? console.error : console.log;
    const prefix = `[TGDB:${context}] ${timestamp}`;
    
    if (data) {
      // Only log sensitive data like URLs in development
      if (process.env.NODE_ENV === 'development' || !message.includes('URL')) {
        logMethod(`${prefix} ${message}`, data);
      } else {
        // Redact API key for production logs
        if (typeof data === 'string' && data.includes('apikey=')) {
          const redactedUrl = data.replace(/apikey=([^&]*)/, 'apikey=REDACTED');
          logMethod(`${prefix} ${message}`, redactedUrl);
        } else {
          logMethod(`${prefix} ${message}`, '[Redacted in production]');
        }
      }
    } else {
      logMethod(`${prefix} ${message}`);
    }
  }
}

// Fetch helper with timeout
async function fetchWithTimeout(url, options = {}, timeout = 15000) {
  // Clone URL for logging to avoid modifying the original
  const logUrl = new URL(url);
  if (logUrl.searchParams.has('apikey')) {
    logUrl.searchParams.set('apikey', 'REDACTED');
  }
  logTGDB('Fetch', `Request: ${logUrl.toString()}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    logTGDB('Fetch', `Response: ${response.status} (${duration}ms)`);
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      logTGDB('Fetch', `Timeout after ${duration}ms: ${logUrl.toString()}`, null, true);
      throw new Error(`Request timeout after ${timeout}ms: ${logUrl.toString()}`);
    }
    
    logTGDB('Fetch', `Error: ${error.message} (${duration}ms)`, error, true);
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
        message: 'API key is missing or empty',
        apiKey: 'Missing'
      };
    }
    
    // Try a simple Platform List API call to check if the API key works
    const url = `${TGDB_API_URL}/Platforms?apikey=${TGDB_API_KEY}`;
    
    logTGDB('Status', 'Checking API status...');
    const response = await fetchWithTimeout(url, {}, 5000);
    
    if (!response.ok) {
      const errorText = await response.text();
      logTGDB('Status', `API returned error status: ${response.status}`, errorText, true);
      
      return { 
        available: false, 
        message: `API returned error status: ${response.status}`,
        apiKey: 'Error'
      };
    }
    
    const data = await response.json();
    logTGDB('Status', 'API response received', { code: data.code, status: data.status });
    
    if (data.code !== 200 || data.status !== 'Success') {
      return { 
        available: false, 
        message: data.status || 'Unknown API error',
        apiKey: 'Invalid'
      };
    }
    
    // Check remaining monthly allowance
    const allowance = data.remaining_monthly_allowance || 0;
    logTGDB('Status', `API is available. Remaining monthly allowance: ${allowance}`);
    
    return { 
      available: true, 
      message: `API is available and key is valid. Remaining allowance: ${allowance}`,
      platforms: Object.keys(data.data.platforms || {}).length,
      apiKey: allowance > 0 ? 'Valid' : 'Limited',
      allowance 
    };
  } catch (error) {
    logTGDB('Status', 'Error checking API status', error, true);
    return { 
      available: false, 
      message: error.message || 'Unknown error checking API status',
      apiKey: 'Error'
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
    if (!gameName) {
      logTGDB('Search', 'Missing game name', null, true);
      throw new Error('Game name is required');
    }
    
    // Check if we have a valid API key
    if (!hasValidApiKey) {
      logTGDB('Search', 'Missing TheGamesDB API key', null, true);
      throw new Error('TheGamesDB API key is missing');
    }
    
    const platformId = getPlatformId(platform);
    logTGDB('Search', `Searching for "${gameName}" on platform: ${platform}${platformId ? ` (ID: ${platformId})` : ' (No platform ID mapping found)'}`);
    
    // Build URL with proper encoding and all required parameters
    // Important: encodeURIComponent for the game name to handle special characters
    let url = new URL(`${TGDB_API_URL}/Games/ByGameName`);
    url.searchParams.append('apikey', TGDB_API_KEY);
    url.searchParams.append('name', gameName);
    url.searchParams.append('fields', 'players,publishers,genres,overview,rating');
    
    if (platformId) {
      url.searchParams.append('filter[platform]', platformId);
    }
    
    url.searchParams.append('include', 'boxart,platform');
    
    // Now make the request
    const response = await fetchWithTimeout(url.toString(), {}, 15000);
    
    // Specifically handle common error codes
    if (response.status === 404) {
      logTGDB('Search', `No games found (404) for: "${gameName}" on platform: ${platform}`, null, true);
      return null;
    }
    
    if (response.status === 403) {
      logTGDB('Search', 'API key invalid or rate limit exceeded (403)', null, true);
      throw new Error('TheGamesDB API key invalid or rate limit exceeded');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      logTGDB('Search', `API error (${response.status})`, errorText, true);
      throw new Error(`TheGamesDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate the structure of the API response
    if (data.code !== 200 || data.status !== 'Success') {
      logTGDB('Search', `API returned non-success status: ${data.status || 'Unknown'}`, data, true);
      throw new Error(`TheGamesDB API error: ${data.status || 'Unknown error'}`);
    }
    
    // Check if we actually got game results
    const gamesCount = data.data?.games?.length || 0;
    if (gamesCount === 0) {
      logTGDB('Search', `No games found for: "${gameName}" on platform: ${platform}`);
      return { data: { games: [] } }; // Return empty games array instead of null
    }
    
    logTGDB('Search', `Found ${gamesCount} games for: "${gameName}" on platform: ${platform}`);
    
    // Add some extra logging for the first result
    if (gamesCount > 0) {
      const firstGame = data.data.games[0];
      logTGDB('Search', `First result: "${firstGame.game_title}" (ID: ${firstGame.id})`);
    }
    
    return data;
  } catch (error) {
    logTGDB('Search', `Error searching for "${gameName}" on platform: ${platform}`, error, true);
    throw error;
  }
}

/**
 * Gets the TheGamesDB platform ID for a given EmulatorJS core
 * 
 * @param {string} core - The EmulatorJS core name (snes, nes, gba, etc.)
 * @returns {number|null} - The corresponding TheGamesDB platform ID
 */
export function getPlatformId(core) {
  if (!core) {
    logTGDB('Platform', 'Missing core name for platform mapping', null, true);
    return null;
  }
  
  // Handle case sensitivity issues - convert to lowercase for consistency
  const normalizedCore = core.toLowerCase();
  
  // Map EmulatorJS cores to TheGamesDB platform IDs
  const platformMap = {
    'snes': 6,       // Super Nintendo Entertainment System (SNES)
    'nes': 7,        // Nintendo Entertainment System (NES)
    'gba': 5,        // Game Boy Advance
    'gb': 9,         // Game Boy
    'gbc': 41,       // Game Boy Color
    'n64': 4,        // Nintendo 64
    'nds': 8,        // Nintendo DS
    'segamd': 36,    // Sega Genesis/Mega Drive
    'segacd': 21,    // Sega CD
    'segasaturn': 17, // Sega Saturn
    'arcade': 23,    // Arcade
    'psx': 10,       // PlayStation
    'psp': 13,       // PlayStation Portable
    // Additional mappings from slug to ID
    'playstation': 10,
    'nintendo-64': 4,
    'super-nintendo': 6,
    'nintendo': 7,
    'gameboy': 9,
    'gameboy-color': 41,
    'gameboy-advance': 5,
    'nintendo-ds': 8,
    'sega-genesis': 36,
    'sega-mega-drive': 36,
    'genesis': 36,
    'megadrive': 36,
    'sega-cd': 21,
    'sega-saturn': 17,
    'playstation-portable': 13,
    // Add more mappings as needed
  };
  
  const platformId = platformMap[normalizedCore];
  
  if (!platformId) {
    logTGDB('Platform', `No platform ID mapping found for core: "${core}"`, null, true);
  }
  
  return platformId || null;
}

/**
 * Fetches game images from TheGamesDB using the game ID
 * 
 * @param {number} gameId - The TheGamesDB game ID
 * @returns {Promise<Object>} - The game images data
 */
export async function getGameImages(gameId) {
  try {
    if (!gameId) {
      logTGDB('Images', 'Missing game ID', null, true);
      throw new Error('Game ID is required');
    }
    
    // Check if we have a valid API key
    if (!hasValidApiKey) {
      logTGDB('Images', 'Missing TheGamesDB API key', null, true);
      throw new Error('TheGamesDB API key is missing');
    }
    
    // Build URL with proper parameters
    let url = new URL(`${TGDB_API_URL}/Games/Images`);
    url.searchParams.append('apikey', TGDB_API_KEY);
    url.searchParams.append('games_id', gameId);
    url.searchParams.append('filter[type]', 'boxart,screenshot,clearlogo,titlescreen,fanart');
    
    logTGDB('Images', `Fetching images for game ID: ${gameId}`);
    const response = await fetchWithTimeout(url.toString(), {}, 15000);
    
    // Handle common error codes
    if (response.status === 404) {
      logTGDB('Images', `No images found (404) for game ID: ${gameId}`, null, true);
      return null;
    }
    
    if (response.status === 403) {
      logTGDB('Images', 'API key invalid or rate limit exceeded (403)', null, true);
      throw new Error('TheGamesDB API key invalid or rate limit exceeded');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      logTGDB('Images', `API error (${response.status})`, errorText, true);
      throw new Error(`TheGamesDB Image API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate the API response
    if (data.code !== 200 || data.status !== 'Success') {
      logTGDB('Images', `API returned non-success status: ${data.status || 'Unknown'}`, data, true);
      throw new Error(`TheGamesDB Image API error: ${data.status || 'Unknown error'}`);
    }
    
    // Check if we actually got images
    const hasImages = data.data?.images && data.data.images[gameId] && data.data.images[gameId].length > 0;
    if (!hasImages) {
      logTGDB('Images', `No images found for game ID: ${gameId}`);
      return { 
        data: { 
          images: { [gameId]: [] },
          base_url: { original: TGDB_IMAGE_BASE_URL }
        } 
      }; // Return empty images array with base_url
    }
    
    const imageCount = data.data.images[gameId].length;
    logTGDB('Images', `Found ${imageCount} images for game ID: ${gameId}`);
    
    // Log the image types that were found
    if (imageCount > 0) {
      const imageTypes = {};
      data.data.images[gameId].forEach(img => {
        const type = img.type + (img.side ? `-${img.side}` : '');
        imageTypes[type] = (imageTypes[type] || 0) + 1;
      });
      logTGDB('Images', 'Image types found:', imageTypes);
    }
    
    return data;
  } catch (error) {
    logTGDB('Images', `Error fetching images for game ID: ${gameId}`, error, true);
    throw error;
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
    if (!gameId) {
      logTGDB('GetById', 'Missing game ID', null, true);
      throw new Error('Game ID is required');
    }
    
    // Check if we have a valid API key
    if (!hasValidApiKey) {
      logTGDB('GetById', 'Missing TheGamesDB API key', null, true);
      throw new Error('TheGamesDB API key is missing');
    }
    
    // Build URL with proper parameters
    let url = new URL(`${TGDB_API_URL}/Games/ByGameID`);
    url.searchParams.append('apikey', TGDB_API_KEY);
    url.searchParams.append('id', gameId);
    url.searchParams.append('fields', 'players,publishers,genres,overview,rating');
    url.searchParams.append('include', 'boxart,platform');
    
    logTGDB('GetById', `Fetching game details for ID: ${gameId}`);
    const response = await fetchWithTimeout(url.toString(), {}, 15000);
    
    // Handle common error codes
    if (response.status === 404) {
      logTGDB('GetById', `Game not found (404) for ID: ${gameId}`, null, true);
      return null;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      logTGDB('GetById', `API error (${response.status})`, errorText, true);
      throw new Error(`TheGamesDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate the API response
    if (data.code !== 200 || data.status !== 'Success') {
      logTGDB('GetById', `API returned non-success status: ${data.status || 'Unknown'}`, data, true);
      throw new Error(`TheGamesDB API error: ${data.status || 'Unknown error'}`);
    }
    
    // Make sure we have game data
    if (!data.data?.games || Object.keys(data.data.games).length === 0) {
      logTGDB('GetById', `No game data found for ID: ${gameId}`);
      return null;
    }
    
    logTGDB('GetById', `Successfully retrieved game data for ID: ${gameId}`);
    return data;
  } catch (error) {
    logTGDB('GetById', `Error fetching game by ID: ${gameId}`, error, true);
    throw error;
  }
}

/**
 * Fetches game cover art from TheGamesDB
 * 
 * @param {string} gameName - The name of the game
 * @param {string} core - The EmulatorJS core being used (snes, nes, etc.)
 * @returns {Promise<{coverUrl: string}>} - The URL to the game cover image
 */
export async function getGameCoverUrl(gameName, core) {
  try {
    if (!gameName || !core) {
      logTGDB('GetCover', 'Missing required parameters', { gameName, core }, true);
      throw new Error('Game name and core are required');
    }
    
    // Check API key status
    if (!hasValidApiKey) {
      logTGDB('GetCover', 'API key is missing', null, true);
      throw new Error('TheGamesDB API key is not configured');
    }
    
    logTGDB('GetCover', `Starting search for: "${gameName}" on platform: ${core}`);
    
    // Step 1: Search for the game by name
    const searchData = await searchGame(gameName, core);
    
    // Handle case where searchGame returns null or empty
    if (!searchData || !searchData.data || !searchData.data.games || searchData.data.games.length === 0) {
      logTGDB('GetCover', `No game found for: "${gameName}" on platform: ${core}`, null, true);
      return null;
    }
    
    // Get the first game result
    const game = searchData.data.games[0];
    const gameId = game.id;
    const gameTitle = game.game_title;
    
    logTGDB('GetCover', `Found game: "${gameTitle}" (ID: ${gameId})`);
    
    // Step 2: Directly fetch images using the Games/Images endpoint with games_id
    logTGDB('GetCover', `Fetching images specifically for game ID: ${gameId}`);
    
    // Create URL for the images endpoint
    let imagesUrl = new URL(`${TGDB_API_URL}/Games/Images`);
    imagesUrl.searchParams.append('apikey', TGDB_API_KEY);
    imagesUrl.searchParams.append('games_id', gameId);
    imagesUrl.searchParams.append('filter[type]', 'boxart,screenshot,clearlogo,titlescreen,fanart');
    
    const imagesResponse = await fetchWithTimeout(imagesUrl.toString(), {}, 15000);
    
    if (!imagesResponse.ok) {
      logTGDB('GetCover', `Failed to fetch images: ${imagesResponse.status}`, null, true);
      return null;
    }
    
    const imagesData = await imagesResponse.json();
    
    if (imagesData.code !== 200 || imagesData.status !== 'Success') {
      logTGDB('GetCover', `API returned non-success status: ${imagesData.status || 'Unknown'}`, imagesData, true);
      return null;
    }
    
    // Check if we have images for this game
    if (!imagesData.data?.images || !imagesData.data.images[gameId] || imagesData.data.images[gameId].length === 0) {
      logTGDB('GetCover', `No images found for game ID: ${gameId}`, null, true);
      return null;
    }
    
    const images = imagesData.data.images[gameId];
    logTGDB('GetCover', `Found ${images.length} images for game ID: ${gameId}`);
    
    // Get the base URLs from the response
    // IMPORTANT: TheGamesDB returns different size options, we should use the appropriate one
    const baseUrls = imagesData.data.base_url;
    
    if (!baseUrls || !baseUrls.original) {
      logTGDB('GetCover', 'Missing base URL in API response, using default', null, true);
    }
    
    // Log all available base URLs for debugging
    logTGDB('GetCover', 'Available base URLs:', baseUrls);
    
    // Default to original size, but we could offer other sizes if needed
    const baseUrl = baseUrls?.original || TGDB_IMAGE_BASE_URL;
    logTGDB('GetCover', `Using image base URL: ${baseUrl}`);
    
    // Image type preference order 
    const imageTypePreference = [
      { type: 'boxart', side: 'front' }, // Front boxart is highest priority
      { type: 'boxart', side: null },    // Any boxart is next
      { type: 'screenshot', side: null },// Screenshots
      { type: 'clearlogo', side: null }, // Game logos
      { type: 'titlescreen', side: null },// Title screens
      { type: 'fanart', side: null }     // Fan art last resort
    ];
    
    // Find the best image according to our preference
    let bestImage = null;
    
    // Find the first image that matches our preference order
    for (const preference of imageTypePreference) {
      if (preference.side) {
        bestImage = images.find(img => 
          img.type === preference.type && img.side === preference.side);
      } else {
        bestImage = images.find(img => img.type === preference.type);
      }
      
      if (bestImage) {
        const typeStr = preference.side 
          ? `${preference.type} (${preference.side})`
          : preference.type;
        logTGDB('GetCover', `Selected image type: ${typeStr}`);
        logTGDB('GetCover', 'Image details:', bestImage);
        break;
      }
    }
    
    // If we found a suitable image, construct the URL
    if (bestImage && bestImage.filename) {
      // IMPORTANT: Make sure the URL is properly constructed
      // Some APIs return full URLs, others return relative paths
      let coverUrl;
      
      if (bestImage.filename.startsWith('http')) {
        // It's already a full URL
        coverUrl = bestImage.filename;
      } else {
        // It's a relative path, need to combine with base URL
        // Ensure there's no double slash between baseUrl and filename
        const baseUrlFixed = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const filenameFixed = bestImage.filename.startsWith('/') 
          ? bestImage.filename.substring(1) 
          : bestImage.filename;
        
        coverUrl = baseUrlFixed + filenameFixed;
      }
      
      logTGDB('GetCover', `Constructed cover URL: ${coverUrl}`);
      return { coverUrl, gameTitle };
    } else {
      // Last resort - use the first image of any type
      if (images.length > 0 && images[0].filename) {
        const firstImage = images[0];
        logTGDB('GetCover', 'Using first available image as fallback:', firstImage);
        
        // Same URL construction logic as above
        let fallbackUrl;
        
        if (firstImage.filename.startsWith('http')) {
          fallbackUrl = firstImage.filename;
        } else {
          const baseUrlFixed = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
          const filenameFixed = firstImage.filename.startsWith('/') 
            ? firstImage.filename.substring(1) 
            : firstImage.filename;
          
          fallbackUrl = baseUrlFixed + filenameFixed;
        }
        
        logTGDB('GetCover', `Using fallback image URL: ${fallbackUrl}`);
        return { coverUrl: fallbackUrl, gameTitle };
      }
      
      logTGDB('GetCover', `No suitable image found for game ID: ${gameId}`, null, true);
    }
    
    return null;
  } catch (error) {
    logTGDB('GetCover', `Error processing "${gameName}" (${core})`, error, true);
    throw error;
  }
} 