'use client';
import { useEffect } from 'react';

export default function GameEmulator({ game }) {
  useEffect(() => {
    // Function to properly encode URLs while preserving the structure
    const encodeGameUrl = (url) => {
      try {
        // Split the URL into parts
        const urlObj = new URL(url);
        
        // Encode each path segment separately
        const encodedPath = urlObj.pathname.split('/')
          .map(segment => encodeURIComponent(decodeURIComponent(segment)))
          .join('/');
        
        // Reconstruct the URL with encoded path
        urlObj.pathname = encodedPath;
        return urlObj.toString();
      } catch (error) {
        console.error('URL encoding error:', error);
        return encodeURI(url);
      }
    };

    // Encode the game URL and route through proxy
    const encodedGameUrl = encodeGameUrl(game.gameLink);
    const gameUrl = `/api/proxy?url=${encodeURIComponent(encodedGameUrl)}`;

    // Configure EmulatorJS
    window.EJS_player = '#game';
    window.EJS_gameUrl = gameUrl;
    window.EJS_core = game.core;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/nightly/data/';
    window.EJS_cors = true; // Enable CORS proxy
    window.EJS_loadStateURL = false; // Disable save state loading for external URLs
    
    // Load the emulator
    const script = document.createElement('script');
    script.src = 'https://cdn.emulatorjs.org/nightly/data/loader.js';
    script.async = true;
    document.body.appendChild(script);

    // Cleanup
    return () => {
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
    };
  }, [game]);

  if (!game || !game.gameLink || !game.core) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-main rounded-xl p-4">
        <div className="text-accent">Error: Game data is missing or incomplete</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-main rounded-xl p-4">
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
