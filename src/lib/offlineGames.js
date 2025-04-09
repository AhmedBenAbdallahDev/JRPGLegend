'use client';

/**
 * Get all offline games from localStorage
 * @returns {Array} Array of offline games from all consoles
 */
export function getAllOfflineGames() {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const allGames = [];
  
  // List of core/console keys to check
  const cores = [
    'nes', 'snes', 'n64', 'gb', 'gbc', 'gba', 'nds',
    'segaMS', 'segaMD', 'segaCD', 'segaGG', 'sega32x', 'saturn',
    'psx', 'psp',
    'arcade', 'atari2600', 'lynx', 'pc', '3do', 'jaguar', 'neogeo', 'coleco'
  ];
  
  // Check each core for games
  for (const core of cores) {
    try {
      const coreKey = `games_${core}`;
      const coreGames = JSON.parse(localStorage.getItem(coreKey) || '[]');
      allGames.push(...coreGames);
    } catch (e) {
      console.error(`Error loading offline games for core ${core}:`, e);
    }
  }
  
  return allGames;
}

/**
 * Get offline games for a specific console/core
 * @param {string} core Core identifier (e.g., 'nes', 'gba')
 * @returns {Array} Array of offline games for the specified core
 */
export function getOfflineGamesByCore(core) {
  if (typeof window === 'undefined' || !core) {
    return [];
  }
  
  try {
    const coreKey = `games_${core}`;
    return JSON.parse(localStorage.getItem(coreKey) || '[]');
  } catch (e) {
    console.error(`Error loading offline games for core ${core}:`, e);
    return [];
  }
}

/**
 * Get an offline game by its ID
 * @param {string} id Game ID to find
 * @returns {Object|null} Game object or null if not found
 */
export function getOfflineGameById(id) {
  if (typeof window === 'undefined' || !id) {
    return null;
  }
  
  const allGames = getAllOfflineGames();
  return allGames.find(game => game.id === id) || null;
}

/**
 * Get an offline game by its slug
 * @param {string} slug Game slug to find
 * @returns {Object|null} Game object or null if not found
 */
export function getOfflineGameBySlug(slug) {
  if (typeof window === 'undefined' || !slug) {
    return null;
  }
  
  const allGames = getAllOfflineGames();
  return allGames.find(game => game.slug === slug) || null;
}

/**
 * Save an offline game to localStorage
 * @param {Object} game Game object to save
 * @returns {boolean} Success status
 */
export function saveOfflineGame(game) {
  if (typeof window === 'undefined' || !game || !game.core) {
    return false;
  }
  
  try {
    const coreKey = `games_${game.core}`;
    const existingGames = JSON.parse(localStorage.getItem(coreKey) || '[]');
    
    // Check if this game already exists (by ID)
    const existingIndex = existingGames.findIndex(g => g.id === game.id);
    
    if (existingIndex >= 0) {
      // Update existing game
      existingGames[existingIndex] = game;
    } else {
      // Add new game
      existingGames.push(game);
    }
    
    // Save back to localStorage
    localStorage.setItem(coreKey, JSON.stringify(existingGames));
    return true;
  } catch (e) {
    console.error('Error saving offline game:', e);
    return false;
  }
}

/**
 * Delete an offline game from localStorage
 * @param {string} id Game ID to delete
 * @returns {boolean} Success status
 */
export function deleteOfflineGame(id) {
  if (typeof window === 'undefined' || !id) {
    return false;
  }
  
  // We need to check all cores since we don't know which one contains this game
  const cores = [
    'nes', 'snes', 'n64', 'gb', 'gbc', 'gba', 'nds',
    'segaMS', 'segaMD', 'segaCD', 'segaGG', 'sega32x', 'saturn',
    'psx', 'psp',
    'arcade', 'atari2600', 'lynx', 'pc', '3do', 'jaguar', 'neogeo', 'coleco'
  ];
  
  for (const core of cores) {
    try {
      const coreKey = `games_${core}`;
      const coreGames = JSON.parse(localStorage.getItem(coreKey) || '[]');
      
      // Filter out the game to delete
      const filteredGames = coreGames.filter(game => game.id !== id);
      
      // If we removed a game, save the updated list
      if (filteredGames.length !== coreGames.length) {
        localStorage.setItem(coreKey, JSON.stringify(filteredGames));
        return true;
      }
    } catch (e) {
      console.error(`Error deleting offline game from core ${core}:`, e);
    }
  }
  
  return false;
}

/**
 * Get all offline categories based on the cores that have games
 * @returns {Array} Array of category objects
 */
export function getOfflineCategories() {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const categories = [];
  const categoryMap = {};
  
  // Core-to-category mapping
  const coreCategories = {
    // Nintendo
    'nes': { title: 'NES', slug: 'nintendo-entertainment-system', group: 'nintendo' },
    'snes': { title: 'Super Nintendo', slug: 'super-nintendo', group: 'nintendo' },
    'n64': { title: 'Nintendo 64', slug: 'nintendo-64', group: 'nintendo' },
    'gb': { title: 'Game Boy', slug: 'game-boy', group: 'nintendo' },
    'gbc': { title: 'Game Boy Color', slug: 'game-boy-color', group: 'nintendo' },
    'gba': { title: 'Game Boy Advance', slug: 'game-boy-advance', group: 'nintendo' },
    'nds': { title: 'Nintendo DS', slug: 'nintendo-ds', group: 'nintendo' },
    
    // Sega
    'segaMS': { title: 'Master System', slug: 'sega-master-system', group: 'sega' },
    'segaMD': { title: 'Mega Drive', slug: 'sega-mega-drive', group: 'sega' },
    'segaCD': { title: 'Sega CD', slug: 'sega-cd', group: 'sega' },
    'segaGG': { title: 'Game Gear', slug: 'sega-game-gear', group: 'sega' },
    'sega32x': { title: 'Sega 32X', slug: 'sega-32x', group: 'sega' },
    'saturn': { title: 'Saturn', slug: 'sega-saturn', group: 'sega' },
    
    // Sony
    'psx': { title: 'PlayStation', slug: 'playstation', group: 'sony' },
    'psp': { title: 'PSP', slug: 'psp', group: 'sony' },
    
    // Other
    'arcade': { title: 'Arcade', slug: 'arcade', group: 'other' },
    'atari2600': { title: 'Atari 2600', slug: 'atari-2600', group: 'other' },
    'lynx': { title: 'Atari Lynx', slug: 'atari-lynx', group: 'other' },
    'pc': { title: 'DOS', slug: 'dos', group: 'other' },
    '3do': { title: '3DO', slug: '3do', group: 'other' },
    'jaguar': { title: 'Jaguar', slug: 'jaguar', group: 'other' },
    'neogeo': { title: 'Neo Geo', slug: 'neo-geo', group: 'other' },
    'coleco': { title: 'ColecoVision', slug: 'colecovision', group: 'other' },
  };
  
  // Check each core for games
  for (const [core, info] of Object.entries(coreCategories)) {
    try {
      const coreKey = `games_${core}`;
      const coreGames = JSON.parse(localStorage.getItem(coreKey) || '[]');
      
      // Only add categories that have games
      if (coreGames.length > 0) {
        const categoryId = `offline_${info.slug}`;
        
        // Avoid duplicates
        if (!categoryMap[categoryId]) {
          categoryMap[categoryId] = {
            id: categoryId,
            title: `${info.title} (Offline)`,
            slug: `offline-${info.slug}`,
            games: coreGames,
            isOffline: true,
            group: info.group
          };
          
          categories.push(categoryMap[categoryId]);
        }
      }
    } catch (e) {
      console.error(`Error loading offline categories for core ${core}:`, e);
    }
  }
  
  return categories;
}

/**
 * Format offline categories in the same structure as online categories for the sidebar
 * @returns {Array} Array of category objects formatted for the sidebar
 */
export function getOfflineCategoriesForMenu() {
  const offlineCategories = getOfflineCategories();
  
  return offlineCategories.map(category => ({
    id: category.id,
    title: category.title,
    slug: category.slug,
    isOffline: true,
    group: category.group,
    games: category.games
  }));
}
