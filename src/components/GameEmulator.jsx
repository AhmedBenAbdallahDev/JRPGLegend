'use client';
import { useEffect, useState } from 'react';
import { configureN64EmulatorJS } from './N64Config';

export default function GameEmulator({ game }) {
  const [debugInfo, setDebugInfo] = useState('');
  
  useEffect(() => {
    // Add debug info
    console.log('[GameEmulator] Loading game:', game);
    setDebugInfo(`Loading game: ${game?.title || 'Unknown'}, Source: ${game?.storageSystem || 'Unknown'}`);
    
    // Function to handle different types of game paths
    const getGameUrl = () => {
      // No game or game link
      if (!game) {
        setDebugInfo('Error: No game provided');
        return null;
      }
      
      // Determine which path property to use
      let gamePath = null;
      
      // Check if this is an online game (has gameLink but no storageSystem property)
      if (game.gameLink && !game.storageSystem) {
        setDebugInfo(`Using gameLink for online game: ${game.gameLink}`);
        return game.gameLink; // Return online game URL directly
      }
      
      // Handle localStorage games
      if (game.storageSystem === 'localStorage') {
        // We'll handle this special case in the main function
        // by directly providing ROM data to EmulatorJS
        return 'use_direct_rom_data';
      }
      
      // For other games, determine which path property to use
      if (game.storagePath) {
        gamePath = game.storagePath;
        setDebugInfo(`Using storagePath: ${gamePath} (from fileSystem storage)`);
      } else if (game.gameLink) {
        gamePath = game.gameLink;
        setDebugInfo(`Using gameLink: ${gamePath} (from localStorage or online)`);
      } else {
        setDebugInfo('Error: No game path found in either storagePath or gameLink');
        return null;
      }
      
      // Handle local files that are directly accessible in the /public directory
      if (gamePath.startsWith('/roms/') || gamePath.startsWith('/game/')) {
        // For paths starting with /roms/ or /game/, we use them directly
        setDebugInfo(`Using local file from public directory: ${gamePath}`);
        return gamePath;
      }
      
      // Handle file:// URLs that need to be encoded
      if (gamePath.startsWith('file://')) {
        setDebugInfo('File URL detected - needs routing through proxy');
        const proxiedUrl = `/api/proxy?url=${encodeURIComponent(gamePath)}`;
        setDebugInfo(`Proxied URL: ${proxiedUrl}`);
        return proxiedUrl;
      }
      
      // Handle remote URLs
      if (gamePath.startsWith('http')) {
        setDebugInfo('Remote URL detected - will use directly');
        return gamePath;
      }
      
      // Default case - treat as local file relative to public directory
      // This is important for simple filenames like 'mario.nes' that
      // come from localStorage games
      const publicPath = `/roms/${gamePath}`;
      setDebugInfo(`Using default path handling: ${gamePath} -> ${publicPath}`);
      return publicPath;
    };

    // Extract ROM data from localStorage for offline games
    const getRomDataFromLocalStorage = () => {
      try {
        const storageKey = `games_${game.core}`;
        const gamesData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const gameData = gamesData.find(g => g.id === game.id);
        
        console.log(`[GameEmulator] Looking for game with ID ${game.id} in ${storageKey}`);
        console.log(`[GameEmulator] Found games in localStorage:`, gamesData.map(g => ({ id: g.id, title: g.title })));
        
        if (gameData && gameData.romData) {
          setDebugInfo(`Found ROM data in localStorage for game: ${game.title}`);
          
          // Ensure ROM data is properly formatted with data header if needed
          // Some emulator cores expect a certain format
          let romData = gameData.romData;
          
          // If it's not already a data URL and doesn't start with data:
          if (!romData.startsWith('data:')) {
            console.log('[GameEmulator] Adding data URL prefix to ROM data');
            // Add the appropriate data URL prefix based on file type
            const mimeType = getMimeTypeForCore(game.core);
            romData = `data:${mimeType};base64,${romData}`;
          }
          
          return romData; // Return the properly formatted ROM data
        } else {
          if (gameData) {
            console.log('[GameEmulator] Game found but ROM data is missing:', gameData);
          }
          setDebugInfo(`Error: No ROM data found in localStorage for game: ${game.title}`);
          return null;
        }
      } catch (error) {
        setDebugInfo(`Error accessing localStorage data: ${error.message}`);
        console.error('[GameEmulator] Error accessing localStorage:', error);
        return null;
      }
    };
    
    // Helper function to determine mime type based on core
    const getMimeTypeForCore = (core) => {
      const mimeTypes = {
        'nes': 'application/x-nes-rom',
        'snes': 'application/x-snes-rom',
        'n64': 'application/x-n64-rom',
        'gb': 'application/x-gameboy-rom',
        'gbc': 'application/x-gameboy-color-rom',
        'gba': 'application/x-gba-rom',
        'segaMD': 'application/x-genesis-rom',
        'psx': 'application/x-playstation-rom',
        // Default for other cores
        'default': 'application/octet-stream'
      };
      
      return mimeTypes[core] || mimeTypes.default;
    };

    // Get the proper game URL or ROM data
    const gameUrl = getGameUrl();
    
    if (!gameUrl) {
      console.error('[GameEmulator] Failed to get game URL');
      setDebugInfo('Error: Failed to get game URL');
      return;
    }

    // Configure EmulatorJS
    window.EJS_player = '#game';
    
    // Additional settings for all emulator instances
    window.EJS_biosUrl = '';
    window.EJS_gameParentElement = document.getElementById('game');
    window.EJS_paths = {
      'screenRecord': false
    };
    
    // Handle direct ROM data for localStorage games
    if (gameUrl === 'use_direct_rom_data') {
      const romData = getRomDataFromLocalStorage();
      if (!romData) {
        setDebugInfo('Error: Failed to get ROM data from localStorage');
        return;
      }
      
      // Set ROM data directly 
      window.EJS_gameUrl = romData; // Provide base64 data directly
      window.EJS_core = game.core === 'n64' ? 'parallel_n64' : game.core;
      window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
      window.EJS_startOnLoaded = true;
      window.EJS_DEBUG_XX = true; // Enable debug mode
      window.EJS_no_download = true; // Don't prompt for download
      window.EJS_onGameStart = () => console.log('Game started');
      
      setDebugInfo(`Emulator configured with direct ROM data for core: ${window.EJS_core}`);
    } else {
      // Normal URL-based configuration for online games or filesystem games
      window.EJS_gameUrl = gameUrl;
      window.EJS_core = game.core === 'n64' ? 'parallel_n64' : game.core;
      window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
      window.EJS_cors = true; // Enable CORS proxy
      window.EJS_loadStateURL = false; // Disable save state loading for external URLs
      window.EJS_startOnLoaded = true; // Start the game as soon as it's loaded
      window.EJS_DEBUG_XX = true; // Enable debug mode
      window.EJS_no_download = true; // Don't prompt for download
      window.EJS_onGameStart = () => console.log('Game started');
      
      setDebugInfo(`Emulator configured - Core: ${window.EJS_core}, URL: ${gameUrl}`);
    }
    
    console.log('[GameEmulator] Final game URL/data:', gameUrl === 'use_direct_rom_data' ? 'Using direct ROM data' : gameUrl);
    console.log('[GameEmulator] Using core:', window.EJS_core);
    
    // Enhanced debug console outputs
    if (game.core) {
      console.log(`[GameEmulator] Core: ${game.core}`);
    } else {
      console.error('[GameEmulator] No core specified!');
    }
    
    if (game.gameLink) {
      console.log(`[GameEmulator] Game link: ${game.gameLink}`);
    }
    
    if (gameUrl === 'use_direct_rom_data') {
      console.log('[GameEmulator] Using ROM data directly from localStorage');
      // Log the first 100 characters of ROM data to confirm it's valid base64
      if (window.EJS_gameUrl) {
        console.log(`[GameEmulator] ROM data preview: ${window.EJS_gameUrl.substring(0, 100)}...`);
      }
    }

    // Load the emulator
    const script = document.createElement('script');
    script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    script.async = true;
    
    // Make sure the game container exists before loading the emulator
    const ensureGameContainer = setInterval(() => {
      if (document.getElementById('game')) {
        clearInterval(ensureGameContainer);
        document.body.appendChild(script);
      }
    }, 100);
    
    // Override N64 core after the script loads
    script.onload = () => {
      if (game.core === 'n64') {
        // Override the core to use parallel_n64 for N64 games
        console.log('Using parallel_n64 core for N64 games instead of mupen64plus_next');
        setDebugInfo('Using parallel_n64 core for N64 games');
        configureN64EmulatorJS();
      }
    };
    
    // Cleanup
    return () => {
      clearInterval(ensureGameContainer);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Clean up EmulatorJS
      window.EJS_player = null;
      window.EJS_gameUrl = null;
      window.EJS_core = null;
      window.EJS_pathtodata = null;
      window.EJS_cors = null;
      window.EJS_loadStateURL = null;
      window.EJS_startOnLoaded = null;
      window.EJS_DEBUG_XX = null;
      window.EJS_no_download = null;
      window.EJS_onGameStart = null;
      window.EJS_gameParentElement = null;
      window.EJS_biosUrl = null;
      window.EJS_paths = null;
    };
  }, [game]);

  if (!game || (!game.gameLink && !game.storagePath) || !game.core) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-main rounded-xl p-4">
        <div className="text-accent font-bold">Error: Game data is missing or incomplete</div>
        <div className="text-accent mt-2">
          Please check:<br/>
          - Game object exists: {game ? "Yes" : "No"}<br/>
          - Path exists: {game && (game.gameLink || game.storagePath) ? "Yes" : "No"}<br/>
          - Core exists: {game?.core ? "Yes" : "No"}
        </div>
        {debugInfo && (
          <div className="mt-2 p-2 bg-black/30 rounded text-sm">
            <pre className="whitespace-pre-wrap text-red-300">{debugInfo}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-main rounded-xl p-4">
      {debugInfo && (
        <div className="mb-4 p-2 bg-blue-950/30 rounded text-sm">
          <div className="font-bold text-xs text-blue-400">Debug Information:</div>
          <pre className="whitespace-pre-wrap text-blue-300 text-xs">{debugInfo}</pre>
        </div>
      )}
      <div id="game" className="aspect-video bg-black"></div>
      <div className="mt-4 text-sm text-accent">
        <p className="font-bold mb-2">Controls:</p>
        <ul className="list-disc list-inside grid grid-cols-2 gap-2">
          <li>Arrow keys: D-pad</li>
          <li>X: A button</li>
          <li>Z: B button</li>
          <li>Enter: Start</li>
          <li>Shift: Select</li>
          <li>Space: Fast Forward</li>
        </ul>
      </div>
    </div>
  );
}
