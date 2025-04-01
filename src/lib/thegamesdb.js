/**
 * TheGamesDB API utilities for fetching game metadata
 * 
 * This file provides functions to interact with TheGamesDB API
 * to retrieve game artwork, metadata, and other resources.
 */

// TheGamesDB API configuration
const TGDB_API_URL = 'https://api.thegamesdb.net/v1';
const TGDB_API_KEY = process.env.TGDB_API_KEY || 'is26c28c263fbe921c94dd6902a900f53e4a88df9e1ab7146d07f5ca35d1c228fc';
const TGDB_IMAGE_BASE_URL = 'https://cdn.thegamesdb.net/images/';

/**
 * Search for a game in TheGamesDB
 * 
 * @param {string} gameName - The name of the game to search for
 * @param {string} platform - The platform/console name (e.g., 'snes', 'nes')
 * @returns {Promise<Object>} - The search results
 */
export async function searchGame(gameName, platform) {
  try {
    // Map EmulatorJS cores to TheGamesDB platform IDs
    const platformId = getPlatformId(platform);
    
    let url = `${TGDB_API_URL}/Games/ByGameName?apikey=${TGDB_API_KEY}&name=${encodeURIComponent(gameName)}`;
    
    // Add platform filter if available
    if (platformId) {
      url += `&filter[platform]=${platformId}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TheGamesDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game data from TheGamesDB:', error);
    return null;
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
 * Fetches game images from TheGamesDB
 * 
 * @param {number} gameId - The TheGamesDB game ID
 * @returns {Promise<Object>} - The game images data
 */
export async function getGameImages(gameId) {
  try {
    const url = `${TGDB_API_URL}/Games/Images?apikey=${TGDB_API_KEY}&games_id=${gameId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TheGamesDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game images:', error);
    return null;
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
    // Search for the game
    const searchData = await searchGame(gameName, core);
    
    if (!searchData || !searchData.data || !searchData.data.games || searchData.data.games.length === 0) {
      return null;
    }
    
    // Get the first game result
    const game = searchData.data.games[0];
    const gameId = game.id;
    
    // Get images for the game
    const imagesData = await getGameImages(gameId);
    
    if (!imagesData || !imagesData.data || !imagesData.data.images || !imagesData.data.images[gameId]) {
      return null;
    }
    
    const images = imagesData.data.images[gameId];
    const baseUrl = imagesData.data.base_url?.original || TGDB_IMAGE_BASE_URL;
    
    // Look for boxart - front preferred
    const boxartFront = images.find(img => img.type === 'boxart' && img.side === 'front');
    const boxart = boxartFront || images.find(img => img.type === 'boxart');
    
    // Fallback to screenshot or clearlogo if no boxart
    const screenshot = images.find(img => img.type === 'screenshot');
    const clearlogo = images.find(img => img.type === 'clearlogo');
    
    // Return the first available image URL
    const image = boxart || screenshot || clearlogo;
    
    if (image) {
      return `${baseUrl}${image.filename}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching game cover from TheGamesDB:', error);
    return null;
  }
} 