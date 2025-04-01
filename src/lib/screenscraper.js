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

/**
 * Searches for a game in the ScreenScraper database
 * 
 * @param {string} gameName - The name of the game to search for
 * @param {string} platform - The system/platform ID (use getPlatformId function)
 * @returns {Promise<Object>} - The game data response
 */
export async function searchGame(gameName, platform) {
  try {
    const url = `${SCREENSCRAPER_API_URL}/jeuInfos.php?devid=${SCREENSCRAPER_DEV_ID}&devpassword=${SCREENSCRAPER_DEV_PASSWORD}&softname=emulatorjs&output=json&romnom=${encodeURIComponent(gameName)}&systemeid=${platform}&ssid=${SCREENSCRAPER_USER}&sspassword=${SCREENSCRAPER_PASSWORD}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ScreenScraper API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game data from ScreenScraper:', error);
    return null;
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
    const platformId = getPlatformId(core);
    if (!platformId) {
      throw new Error(`Unsupported platform for core: ${core}`);
    }
    
    const gameData = await searchGame(gameName, platformId);
    
    if (!gameData || !gameData.response || !gameData.response.jeu) {
      return null;
    }
    
    // Get box/cover art - preferring front boxart
    const mediaData = gameData.response.jeu.medias;
    
    if (!mediaData) return null;
    
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
    console.error('Error fetching game cover:', error);
    return null;
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
    
    return {
      title: game.noms?.nom || gameName,
      description: game.synopsis?.synopsis || '',
      developer: game.developpeur?.text || '',
      publisher: game.editeur?.text || '',
      releaseDate: game.dates?.date?.[0]?.text || '',
      genre: game.genres?.genre?.[0]?.text || '',
      players: game.joueurs?.text || '',
      rating: game.classifications?.classification?.[0]?.text || '',
      coverUrl: await getGameCoverUrl(gameName, core)
    };
  } catch (error) {
    console.error('Error fetching game metadata:', error);
    return null;
  }
} 