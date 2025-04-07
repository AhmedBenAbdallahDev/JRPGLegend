/**
 * ScreenScraper.fr API utilities for fetching game metadata
 * 
 * This file provides functions to interact with the ScreenScraper API
 * to retrieve game artwork, metadata, and other resources.
 */

// You will need to register for a ScreenScraper account to use their API
// https://www.screenscraper.fr/
const SCREENSCRAPER_API_URL = 'https://www.screenscraper.fr/api2';
const SCREENSCRAPER_DEV_ID = process.env.SCREENSCRAPER_DEV_ID;
const SCREENSCRAPER_DEV_PASSWORD = process.env.SCREENSCRAPER_DEV_PASSWORD;
const SCREENSCRAPER_USER = process.env.SCREENSCRAPER_USER;
const SCREENSCRAPER_PASSWORD = process.env.SCREENSCRAPER_PASSWORD;
const SCREENSCRAPER_SOFTNAME = process.env.SCREENSCRAPER_SOFTNAME || 'JRPGLegend';

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
    const hasCredentials = !!(SCREENSCRAPER_USER && SCREENSCRAPER_PASSWORD && SCREENSCRAPER_DEV_ID && SCREENSCRAPER_DEV_PASSWORD);
    
    if (!hasCredentials) {
      return {
        available: false,
        message: 'Missing ScreenScraper API credentials',
        credentials: {
          user: !!SCREENSCRAPER_USER,
          hasPassword: !!SCREENSCRAPER_PASSWORD,
          devId: !!SCREENSCRAPER_DEV_ID,
          hasDevPassword: !!SCREENSCRAPER_DEV_PASSWORD
        }
      };
    }
    
    // Try to fetch a very common game as a test
    const platformId = getPlatformId('nes');
    const url = `${SCREENSCRAPER_API_URL}/jeuInfos.php?devid=${encodeURIComponent(SCREENSCRAPER_DEV_ID)}&devpassword=${encodeURIComponent(SCREENSCRAPER_DEV_PASSWORD)}&softname=${encodeURIComponent(SCREENSCRAPER_SOFTNAME)}&output=json&romnom=${encodeURIComponent('Super Mario Bros')}&systemeid=${platformId}&ssid=${encodeURIComponent(SCREENSCRAPER_USER)}&sspassword=${encodeURIComponent(SCREENSCRAPER_PASSWORD)}`;
    
    console.log(`[ScreenScraper] Testing API with URL: ${url.replace(SCREENSCRAPER_DEV_PASSWORD, 'REDACTED').replace(SCREENSCRAPER_PASSWORD, 'REDACTED')}`);
    
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
          hasPassword: !!SCREENSCRAPER_PASSWORD,
          devId: !!SCREENSCRAPER_DEV_ID,
          hasDevPassword: !!SCREENSCRAPER_DEV_PASSWORD
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
            hasPassword: !!SCREENSCRAPER_PASSWORD,
            devId: !!SCREENSCRAPER_DEV_ID,
            hasDevPassword: !!SCREENSCRAPER_DEV_PASSWORD
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
          hasPassword: !!SCREENSCRAPER_PASSWORD,
          devId: !!SCREENSCRAPER_DEV_ID,
          hasDevPassword: !!SCREENSCRAPER_DEV_PASSWORD
        }
      };
    } catch (parseError) {
      return {
        available: false,
        message: `Failed to parse API response: ${parseError.message}`,
        credentials: {
          user: !!SCREENSCRAPER_USER,
          hasPassword: !!SCREENSCRAPER_PASSWORD,
          devId: !!SCREENSCRAPER_DEV_ID,
          hasDevPassword: !!SCREENSCRAPER_DEV_PASSWORD
        }
      };
    }
  } catch (error) {
    return {
      available: false,
      message: error.message || 'Unknown error checking API status',
      credentials: {
        user: !!SCREENSCRAPER_USER,
        hasPassword: !!SCREENSCRAPER_PASSWORD,
        devId: !!SCREENSCRAPER_DEV_ID,
        hasDevPassword: !!SCREENSCRAPER_DEV_PASSWORD
      }
    };
  }
}

/**
 * Searches for a game in the ScreenScraper database
 * 
 * @param {string} name - The name of the game to search for
 * @param {string} platformId - The system/platform ID (use getPlatformId function)
 * @returns {Promise<Object>} - The game data response
 */
export async function searchGame(name, platformId) {
  try {
    // Get API credentials from environment variables
    const devId = process.env.SCREENSCRAPER_DEV_ID;
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD;
    const user = process.env.SCREENSCRAPER_USER;
    const password = process.env.SCREENSCRAPER_PASSWORD;
    const softname = process.env.SCREENSCRAPER_SOFTNAME || 'JRPGLegend';

    // Validate credentials
    if (!devId || !devPassword || !user || !password) {
      throw new Error('Missing ScreenScraper API credentials in environment variables');
    }

    // Validate required parameters
    if (!name) {
      throw new Error('Game name is required');
    }

    if (!platformId) {
      throw new Error('Platform ID is required');
    }

    console.log(`[ScreenScraper] Using platform ID: ${platformId} (type: ${typeof platformId})`);
    
    // Convert platformId to number if it's a string
    const systemId = parseInt(platformId, 10);
    if (isNaN(systemId)) {
      throw new Error(`Invalid platform ID: ${platformId}, must be a number`);
    }

    // Construct the API URL using the correct endpoint
    const apiUrl = `${SCREENSCRAPER_API_URL}/jeuInfos.php?devid=${devId}&devpassword=${devPassword}&softname=${encodeURIComponent(softname)}&output=json&romnom=${encodeURIComponent(name)}&systemeid=${systemId}&ssid=${user}&sspassword=${password}`;

    console.log(`[ScreenScraper] Fetching game info for ${name} on platform ID ${systemId}`);
    console.log(`[ScreenScraper] URL: ${apiUrl.replace(devPassword, 'REDACTED').replace(password, 'REDACTED')}`);

    // Fetch data from ScreenScraper API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`ScreenScraper API responded with status: ${response.status}`);
    }
    
    const data = await response.json();

    // Check if the API returned an error
    if (data.error) {
      throw new Error(data.error || 'ScreenScraper API returned an error');
    }

    // Check if game data exists
    if (!data.response || !data.response.jeu) {
      throw new Error('No game data found');
    }

    // Process the response to extract all image types
    const game = data.response.jeu;
    console.log(`Game ID: ${game.id}, Name: ${game.noms?.[0]?.text || name}`);
    
    const processedData = {
      id: game.id,
      name: game.noms?.[0]?.text || name,
      system: game.systeme?.text || '',
      region: game.region?.text || '',
      publisher: game.editeur?.text || '',
      developer: game.developpeur?.text || '',
      players: game.joueurs?.text || '',
      rating: game.note?.text || '',
      releaseDate: game.dates?.[0]?.text || '',
      genre: game.genres?.map(g => g.text).join(', ') || '',
      perspective: game.perspectives?.map(p => p.text).join(', ') || '',
      description: game.synopsis?.text || '',
      images: []
    };

    // Debug: Log what media types exist in the response
    console.log(`Media types in response: ${Object.keys(game).filter(key => 
      ['medias', 'box', 'video', 'fanart', 'bezel', 'title', 'ss'].includes(key)
    ).join(', ')}`);

    // Extract all image types
    const processMediaItem = (item, type) => {
      if (item && item.url) {
        processedData.images.push({
          type: type,
          url: item.url,
          region: item.region || '',
          resolution: item.resolution || '',
          crc: item.crc || '',
          md5: item.md5 || '',
          sha1: item.sha1 || ''
        });
      }
    };

    // Process media from different arrays in the response
    if (game.medias && Array.isArray(game.medias)) {
      console.log(`Found ${game.medias.length} items in medias array`);
      game.medias.forEach(media => processMediaItem(media, media.type || 'media'));
    }

    // Process specific media types that might be separate
    ['box', 'support', 'video', 'fanart', 'bezel', 'title', 'ss', 'sstitle', 'steamgrid'].forEach(mediaType => {
      if (game[mediaType] && Array.isArray(game[mediaType])) {
        console.log(`Found ${game[mediaType].length} items of type ${mediaType}`);
        game[mediaType].forEach(item => processMediaItem(item, mediaType));
      }
    });

    console.log(`Total processed images: ${processedData.images.length}`);
    
    // Add direct URLs for common image types for convenience
    if (processedData.images.length > 0) {
      const boxImage = processedData.images.find(img => img.type === 'box');
      const titleImage = processedData.images.find(img => img.type === 'title');
      const ssImage = processedData.images.find(img => img.type === 'ss');
      
      if (boxImage) processedData.boxUrl = boxImage.url;
      if (titleImage) processedData.titleUrl = titleImage.url;
      if (ssImage) processedData.screenshotUrl = ssImage.url;
    }

    return processedData;
  } catch (error) {
    console.error('Error in searchGame:', error);
    throw error;
  }
}

/**
 * Get ScreenScraper platform ID from emulator core
 * @param {string} core - The EmulatorJS core ID 
 * @returns {number|null} The ScreenScraper platform ID
 */
export function getPlatformId(core) {
  // Map EmulatorJS cores to ScreenScraper platform IDs
  // Full list available at: https://www.screenscraper.fr/api2/systemesListe.php
  const platformMap = {
    'nes': 1,
    'snes': 3,
    'n64': 4,
    'gba': 12,
    'nds': 15,
    'genesis': 6, // Was incorrectly 1 (NES), fixed to 6 (Sega Genesis/Mega Drive)
    'segacd': 20,
    '32x': 19,
    'saturn': 22,
    'psx': 57,
    'ps2': 58,
    'psp': 61,
    'arcade': 75,
    'gb': 9,
    'gbc': 10,
    'atari2600': 25,
    'atari5200': 26,
    'atari7800': 27,
    'lynx': 28,
    'jaguar': 29,
    'tg16': 31,
    'pcenginecd': 32,
    'wonderswan': 45,
    'wonderswancolor': 46,
    'neogeo': 142,
    'neogeocd': 70,
    'ngp': 81, // Was incorrectly 25 (Atari 2600), fixed to 81 (Neo Geo Pocket)
    'ngpc': 82,
    'virtualboy': 11,
    'gamegear': 21,
    'mastersystem': 2,
    // Add more as needed
  };

  // Also map some common aliases
  const aliases = {
    'megadrive': 'genesis',
    'md': 'genesis',
    'sega': 'genesis',
    'segagenesis': 'genesis',
    'famicom': 'nes',
    'gb': 'gameboy',
    'nintendo': 'nes'
    // Add more as needed
  };

  // Use the alias if available, otherwise use the core directly
  const normalizedCore = aliases[core.toLowerCase()] || core.toLowerCase();
  const platformId = platformMap[normalizedCore];
  
  console.log(`[ScreenScraper] Mapped core '${core}' to platform ID: ${platformId}`);
  
  return platformId || null;
}

/**
 * Gets the cover URL for a game from ScreenScraper
 * @param {string} name - The name of the game to search for
 * @param {string} core - The emulator core/platform ID
 * @returns {Promise<Object>} - The game data response
 */
export async function getGameCoverUrl(name, core) {
  try {
    // This function can be called from the client side (browser) or server side
    // If called from client side, we need to fetch platforms from the API
    // If called from server side, we can use the internal function
    
    let platformId;
    
    // Check if we're running in a browser (client component)
    const isClient = typeof window !== 'undefined';
    
    if (isClient) {
      // Client-side: fetch platforms from API
      const response = await fetch('/api/screenscraper/platforms');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch platform mappings');
      }
      
      const platform = data.platforms.find(p => p.id === core);
      if (!platform) {
        throw new Error(`Unsupported platform: ${core}`);
      }
      
      platformId = platform.platformId;
    } else {
      // Server-side: use direct mapping
      platformId = getPlatformId(core);
      if (!platformId) {
        throw new Error(`Unsupported platform: ${core}`);
      }
    }

    // Search for the game using the platform ID
    const gameData = await searchGame(name, platformId);
    return gameData;
  } catch (error) {
    console.error('Error in getGameCoverUrl:', error);
    throw error;
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