/**
 * Game Storage Service
 * 
 * This service manages client-side storage of game ROMs and related files
 * using IndexedDB for large file storage.
 */

// Database constants
const DB_NAME = 'JRPGLegend_Storage';
const DB_VERSION = 1;
const ROMS_STORE = 'roms';
const SAVES_STORE = 'saves';
const COVERS_STORE = 'covers';
const METADATA_STORE = 'metadata';

/**
 * Initialize the storage database
 * @returns {Promise<IDBDatabase>} Database instance
 */
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Your browser does not support IndexedDB, which is required for ROM storage'));
      return;
    }
    
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(new Error('Could not open game storage database'));
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(ROMS_STORE)) {
        db.createObjectStore(ROMS_STORE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(SAVES_STORE)) {
        db.createObjectStore(SAVES_STORE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(COVERS_STORE)) {
        db.createObjectStore(COVERS_STORE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
};

/**
 * Store a ROM file
 * @param {File} file - The ROM file to store
 * @param {string} gameTitle - Title of the game
 * @param {string} platform - Game platform/console
 * @returns {Promise<string>} Client storage path
 */
export const storeROM = async (file, gameTitle, platform) => {
  try {
    const db = await initDatabase();
    const safeTitle = gameTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const id = `${safeTitle}_${platform}`;
    const storagePath = `client-storage://roms/${id}`;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ROMS_STORE, METADATA_STORE], 'readwrite');
      
      transaction.onerror = (event) => {
        console.error('Transaction error:', event.target.error);
        reject(new Error('Failed to store ROM file'));
      };
      
      // Read the file as an ArrayBuffer
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          // Store the ROM data
          const romStore = transaction.objectStore(ROMS_STORE);
          const romData = {
            id,
            title: gameTitle,
            platform,
            data: event.target.result,
            size: file.size,
            type: file.type || 'application/octet-stream',
            filename: file.name,
            dateAdded: new Date().toISOString()
          };
          
          const romRequest = romStore.put(romData);
          
          // Store metadata separately (without the ROM data)
          const metadataStore = transaction.objectStore(METADATA_STORE);
          const metadata = {
            id,
            title: gameTitle,
            platform,
            size: file.size,
            type: file.type || 'application/octet-stream',
            filename: file.name,
            storagePath,
            dateAdded: new Date().toISOString()
          };
          
          const metaRequest = metadataStore.put(metadata);
          
          metaRequest.onsuccess = () => {
            resolve(storagePath);
          };
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read ROM file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error('Error storing ROM:', error);
    throw error;
  }
};

/**
 * Get a ROM file by ID
 * @param {string} id - The ROM ID
 * @returns {Promise<Object>} ROM data
 */
export const getROM = async (id) => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ROMS_STORE], 'readonly');
    const store = transaction.objectStore(ROMS_STORE);
    const request = store.get(id);
    
    request.onerror = (event) => {
      reject(new Error('Failed to retrieve ROM'));
    };
    
    request.onsuccess = (event) => {
      if (request.result) {
        resolve(request.result);
      } else {
        reject(new Error('ROM not found'));
      }
    };
  });
};

/**
 * Get all stored ROM metadata (without the ROM data)
 * @returns {Promise<Array>} List of ROM metadata
 */
export const getAllROMs = async () => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([METADATA_STORE], 'readonly');
    const store = transaction.objectStore(METADATA_STORE);
    const request = store.getAll();
    
    request.onerror = (event) => {
      reject(new Error('Failed to retrieve ROMs list'));
    };
    
    request.onsuccess = (event) => {
      resolve(request.result || []);
    };
  });
};

/**
 * Delete a ROM by ID
 * @param {string} id - The ROM ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteROM = async (id) => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ROMS_STORE, METADATA_STORE], 'readwrite');
    const romStore = transaction.objectStore(ROMS_STORE);
    const metaStore = transaction.objectStore(METADATA_STORE);
    
    // Delete from both stores
    const romRequest = romStore.delete(id);
    const metaRequest = metaStore.delete(id);
    
    transaction.oncomplete = () => {
      resolve(true);
    };
    
    transaction.onerror = (event) => {
      reject(new Error('Failed to delete ROM'));
    };
  });
};

/**
 * Check if a client-side storage path exists
 * @param {string} storagePath - The client storage path to check
 * @returns {Promise<boolean>} Whether the path exists
 */
export const checkStoragePath = async (storagePath) => {
  if (!storagePath || !storagePath.startsWith('client-storage://')) {
    return false;
  }
  
  try {
    // Extract the store type and ID from the path
    const pathParts = storagePath.replace('client-storage://', '').split('/');
    if (pathParts.length < 2) return false;
    
    const storeType = pathParts[0]; // 'roms', 'saves', etc.
    const id = pathParts[1]; // the file ID
    
    const db = await initDatabase();
    
    return new Promise((resolve) => {
      // Use metadata store for lightweight checking
      const transaction = db.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(!!request.result);
      };
      
      request.onerror = () => {
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Error checking storage path:', error);
    return false;
  }
};

export default {
  initDatabase,
  storeROM,
  getROM,
  getAllROMs,
  deleteROM,
  checkStoragePath
}; 