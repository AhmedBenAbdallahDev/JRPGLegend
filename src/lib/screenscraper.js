/**
 * ScreenScraper.fr API utilities for fetching game metadata
 * 
 * This file provides functions to interact with the ScreenScraper API
 * to retrieve game artwork, metadata, and other resources.
 */

// You will need to register for a ScreenScraper account to use their API
// https://www.screenscraper.fr/
const SCREENSCRAPER_API_URL = 'https://www.screenscraper.fr/api2';
const SCREENSCRAPER_DEV_ID = process.env.SCREENSCRAPER_DEV_ID || '';  // Register and get a devid
const SCREENSCRAPER_DEV_PASSWORD = process.env.SCREENSCRAPER_DEV_PASSWORD || '';  // Register and get a devpassword
const SCREENSCRAPER_USER = process.env.SCREENSCRAPER_USER || '';  // Your screenscraper username
const SCREENSCRAPER_PASSWORD = process.env.SCREENSCRAPER_PASSWORD || '';  // Your screenscraper password

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
 * Checks the ScreenScraper API status by trying to fetch a known game
 * 
 * @returns {Promise<object>} Object containing API status information
 */
export async function checkApiStatus() {
  try {
    // Check if required credentials are present
    const hasCredentials = !!(SCREENSCRAPER_USER && SCREENSCRAPER_PASSWORD);
    
    if (!hasCredentials) {
      return {
        available: false,
        message: 'Missing ScreenScraper API credentials',
        credentials: {
          user: !!SCREENSCRAPER_USER,
          hasPassword: !!SCREENSCRAPER_PASSWORD,
          devId: !!SCREENSCRAPER_DEV_ID
        }
      };
    }
    
    // Try to fetch a very common game as a test
    const platformId = getPlatformId('nes');
    const url = `${SCREENSCRAPER_API_URL}/jeuInfos.php?devid=${SCREENSCRAPER_DEV_ID}&devpassword=${SCREENSCRAPER_DEV_PASSWORD}&softname=emulatorjs&output=json&romnom=${encodeURIComponent('Super Mario Bros')}&systemeid=${platformId}&ssid=${SCREENSCRAPER_USER}&sspassword=${SCREENSCRAPER_PASSWORD}`;
    
    const response = await fetchWithTimeout(url, {}, 8000); // 8 second timeout for status check
    
    if (!response.ok) {
      let message = 'API responded with an error';
      
      if (response.status === 429) {
        message = 'Rate limit exceeded';
      } else if (response.status === 401 || response.status === 403) {
        message = 'Authentication failed - check your credentials';
      } else if (response.status === 504) {
        message = 'Gateway timeout - the service might be experiencing high load';
      } else {
        message = `API error: ${response.status}`;
      }
      
      return {
        available: false,
        message,
        httpStatus: response.status,
        credentials: {
          user: !!SCREENSCRAPER_USER,
          hasPassword: !!SCREENSCRAPER_PASSWORD
        }
      };
    }
    
    // Try to parse the response
    try {
      const data = await response.json();
      
      // Check for API-level errors
      if (data.error) {
        return {
          available: false,
          message: `API error: ${data.error}`,
          credentials: {
            user: !!SCREENSCRAPER_USER,
            hasPassword: !!SCREENSCRAPER_PASSWORD
          }
        };
      }
      
      // Check if the response contains game data
      const gameFound = !!(data.response && data.response.jeu);
      
      return {
        available: true,
        message: gameFound ? 'API is available and returned test game data' : 'API is available but test game was not found',
        gameFound,
        credentials: {
          user: !!SCREENSCRAPER_USER,
          hasPassword: !!SCREENSCRAPER_PASSWORD
        }
      };
    } catch (parseError) {
      return {
        available: false,
        message: `Failed to parse API response: ${parseError.message}`,
        credentials: {
          user: !!SCREENSCRAPER_USER,
          hasPassword: !!SCREENSCRAPER_PASSWORD
        }
      };
    }
  } catch (error) {
    return {
      available: false,
      message: error.message || 'Unknown error checking API status',
      credentials: {
        user: !!SCREENSCRAPER_USER,
        hasPassword: !!SCREENSCRAPER_PASSWORD
      }
    };
  }
}

/**
 * Searches for a game in the ScreenScraper database
 * 
 * @param {string} gameName - The name of the game to search for
 * @param {string} platform - The system/platform ID (use getPlatformId function)
 * @returns {Promise<Object>} - The game data response
 */
export async function searchGame(gameName, platform) {
  try {
    // Check if required credentials are present
    if (!SCREENSCRAPER_USER || !SCREENSCRAPER_PASSWORD) {
      throw new Error('ScreenScraper credentials missing. Check your environment variables.');
    }
    
    const url = `${SCREENSCRAPER_API_URL}/jeuInfos.php?devid=${SCREENSCRAPER_DEV_ID}&devpassword=${SCREENSCRAPER_DEV_PASSWORD}&softname=emulatorjs&output=json&romnom=${encodeURIComponent(gameName)}&systemeid=${platform}&ssid=${SCREENSCRAPER_USER}&sspassword=${SCREENSCRAPER_PASSWORD}`;
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('ScreenScraper API rate limit exceeded. Please try again later.');
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('ScreenScraper API authentication failed. Check your credentials.');
      } else if (response.status === 504) {
        throw new Error('ScreenScraper API gateway timeout. The service might be experiencing high load.');
      } else {
        throw new Error(`ScreenScraper API error: ${response.status}`);
      }
    }
    
    try {
      const data = await response.json();
      
      // Check for API-level errors
      if (data.error) {
        throw new Error(`ScreenScraper API error: ${data.error}`);
      }
      
      return data;
    } catch (parseError) {
      throw new Error(`Failed to parse ScreenScraper API response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error fetching game data from ScreenScraper:', error);
    throw error; // Propagate the error for better handling upstream
  }
}

/**
 * Gets the ScreenScraper platform ID for a given EmulatorJS core
 * 
 * @param {string} core - The EmulatorJS core name (snes, nes, gba, etc.)
 * @returns {number} - The corresponding ScreenScraper platform ID
 */
export function getPlatformId(core) {
  // Map EmulatorJS cores to ScreenScraper platform IDs
  const platformMap = {
    'snes': 3,     // Super Nintendo
    'nes': 3,      // Nintendo Entertainment System
    'gba': 12,     // Game Boy Advance
    'gb': 9,       // Game Boy
    'gbc': 10,     // Game Boy Color
    'n64': 14,     // Nintendo 64
    'nds': 15,     // Nintendo DS
    'segaMD': 1,   // Sega Genesis/Mega Drive
    'segaCD': 20,  // Sega CD
    'segaSaturn': 22, // Sega Saturn
    'arcade': 75,  // Arcade (MAME)
    'psx': 57,     // PlayStation 1
    'psp': 61,     // PlayStation Portable
    // Add more mappings as needed
  };
  
  return platformMap[core] || 0;
}

/**
 * Fetches game cover art from ScreenScraper
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
    
    const platformId = getPlatformId(core);
    if (!platformId) {
      throw new Error(`Unsupported platform for core: ${core}`);
    }
    
    const gameData = await searchGame(gameName, platformId);
    
    if (!gameData || !gameData.response) {
      throw new Error('Invalid response from ScreenScraper API');
    }
    
    if (!gameData.response.jeu) {
      // Game not found, but API responded
      return null;
    }
    
    // Get box/cover art - preferring front boxart
    const mediaData = gameData.response.jeu.medias;
    
    if (!mediaData) {
      // No media available for this game
      return null;
    }
    
    // Try to find the box front image (type 1 in ScreenScraper)
    const boxFront = mediaData.find(media => media.type === 'box-2D' && media.region === 'eu') || 
                     mediaData.find(media => media.type === 'box-2D' && media.region === 'us') ||
                     mediaData.find(media => media.type === 'box-2D');
    
    if (boxFront && boxFront.url) {
      return boxFront.url;
    }
    
    // Fallback to screenshot if no boxart
    const screenshot = mediaData.find(media => media.type === 'ss');
    return screenshot ? screenshot.url : null;
    
  } catch (error) {
    console.error(`Error fetching game cover for ${gameName} (${core}):`, error);
    throw error; // Propagate the error for better handling upstream
  }
}

/**
 * Downloads and saves a game cover image locally
 * 
 * @param {string} imageUrl - URL of the image to download
 * @param {string} gameName - Name of the game (for filename)
 * @returns {Promise<string>} - Path to the saved image
 */
export async function downloadGameCover(imageUrl, gameName) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const filename = `${gameName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
    const path = `/game/${filename}`;
    
    // You'll need to implement file saving logic here based on your storage system
    // For example, saving to local filesystem or S3 bucket
    
    return filename;
  } catch (error) {
    console.error('Error downloading game cover:', error);
    return null;
  }
}

/**
 * Fetches additional game metadata from ScreenScraper
 * 
 * @param {string} gameName - The name of the game
 * @param {string} core - The EmulatorJS core
 * @returns {Promise<Object>} - Game metadata
 */
export async function getGameMetadata(gameName, core) {
  try {
    const platformId = getPlatformId(core);
    const gameData = await searchGame(gameName, platformId);
    
    if (!gameData || !gameData.response || !gameData.response.jeu) {
      return null;
    }
    
    const game = gameData.response.jeu;
    
    // Get cover URL but don't let it fail the whole metadata request
    let coverUrl = null;
    try {
      coverUrl = await getGameCoverUrl(gameName, core);
    } catch (coverError) {
      console.error('Error fetching cover URL:', coverError);
    }
    
    return {
      title: game.noms?.nom || gameName,
      description: game.synopsis?.synopsis || '',
      developer: game.developpeur?.text || '',
      publisher: game.editeur?.text || '',
      releaseDate: game.dates?.date?.[0]?.text || '',
      genre: game.genres?.genre?.[0]?.text || '',
      players: game.joueurs?.text || '',
      rating: game.classifications?.classification?.[0]?.text || '',
      coverUrl: coverUrl
    };
  } catch (error) {
    console.error('Error fetching game metadata:', error);
    throw error; // Propagate the error for better handling upstream
  }
} 