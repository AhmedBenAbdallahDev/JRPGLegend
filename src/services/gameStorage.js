/**
 * Game Storage Service
 * 
 * This service manages client-side storage of game ROMs and related files
 * using local file system for consistency with image storage.
 */

// Constants
const ROMS_METADATA_KEY = 'local_roms_metadata';
export const ROMS_DIRECTORY = '/roms/';

/**
 * Store a ROM file
 * @param {File} file - The ROM file to store
 * @param {string} gameTitle - Title of the game
 * @param {string} platform - Game platform/console
 * @returns {Promise<string>} Client storage path
 */
export const storeROM = async (file, gameTitle, platform) => {
  try {
    console.log(`[gameStorage] Storing ROM: ${file.name} for ${gameTitle} (${platform})`);
    
    // Create a sanitized filename
    const safeTitle = gameTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '').toLowerCase();
    
    // Use FormData to upload the file to our local server
    const formData = new FormData();
    formData.append('file', file);
    formData.append('directory', 'roms'); // Tell the upload API to store in /public/roms/
    
    console.log(`[gameStorage] Uploading ROM file: ${safeFileName}`);
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.error || 'Failed to upload ROM file');
    }

    const uploadResult = await uploadResponse.json();
    console.log(`[gameStorage] ROM uploaded successfully: ${uploadResult.path}`);
    
    // Create the metadata
    const id = `${safeTitle}_${platform}`;
    const storagePath = uploadResult.path;
    
    // Store metadata in localStorage
    const metadata = {
      id,
      title: gameTitle,
      platform,
      fileName: safeFileName,
      size: file.size,
      type: file.type || 'application/octet-stream',
      storagePath,
      dateAdded: new Date().toISOString()
    };
    
    // Get existing metadata or initialize empty array
    const existingMetadata = getAllROMsMetadata();
    
    // Check if this ROM already exists
    const existingIndex = existingMetadata.findIndex(item => item.id === id);
    if (existingIndex >= 0) {
      existingMetadata[existingIndex] = metadata;
    } else {
      existingMetadata.push(metadata);
    }
    
    // Save updated metadata
    localStorage.setItem(ROMS_METADATA_KEY, JSON.stringify(existingMetadata));
    console.log(`[gameStorage] ROM metadata saved: ${id}`);
    
    return storagePath;
  } catch (error) {
    console.error('[gameStorage] Error storing ROM:', error);
    throw error;
  }
};

/**
 * Get all stored ROM metadata
 * @returns {Array} List of ROM metadata
 */
export const getAllROMs = () => {
  console.log('[gameStorage] Getting all ROMs metadata');
  return getAllROMsMetadata();
};

/**
 * Helper function to get ROM metadata from localStorage
 */
const getAllROMsMetadata = () => {
  try {
    const metadata = localStorage.getItem(ROMS_METADATA_KEY);
    return metadata ? JSON.parse(metadata) : [];
  } catch (e) {
    console.error('[gameStorage] Error parsing ROM metadata:', e);
    return [];
  }
};

/**
 * Get a ROM by ID
 * @param {string} id - The ROM ID to find
 * @returns {Object|null} ROM metadata or null if not found
 */
export const getROM = (id) => {
  console.log(`[gameStorage] Getting ROM by ID: ${id}`);
  const allROMs = getAllROMsMetadata();
  return allROMs.find(rom => rom.id === id) || null;
};

/**
 * Delete a ROM by ID
 * @param {string} id - The ROM ID to delete
 * @returns {boolean} Success status
 */
export const deleteROM = async (id) => {
  console.log(`[gameStorage] Deleting ROM: ${id}`);
  try {
    const allROMs = getAllROMsMetadata();
    const romToDelete = allROMs.find(rom => rom.id === id);
    
    if (!romToDelete) {
      console.log(`[gameStorage] ROM not found: ${id}`);
      return false;
    }
    
    // Remove the file via API (would need to implement this endpoint)
    // For now we'll just remove the metadata as the file will remain on disk
    console.log(`[gameStorage] Removing metadata for ROM: ${id}`);
    
    // Filter out the deleted ROM
    const updatedROMs = allROMs.filter(rom => rom.id !== id);
    
    // Save updated metadata
    localStorage.setItem(ROMS_METADATA_KEY, JSON.stringify(updatedROMs));
    
    return true;
  } catch (e) {
    console.error(`[gameStorage] Error deleting ROM ${id}:`, e);
    return false;
  }
};

/**
 * Check if a client-side storage path exists
 * @param {string} path - The path to check
 * @returns {boolean} Whether the path exists in our metadata
 */
export const checkStoragePath = (path) => {
  if (!path) return false;
  
  const allROMs = getAllROMsMetadata();
  return allROMs.some(rom => rom.storagePath === path);
};

export default {
  storeROM,
  getROM,
  getAllROMs,
  deleteROM,
  checkStoragePath
}; 