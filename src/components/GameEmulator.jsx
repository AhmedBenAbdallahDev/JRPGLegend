'use client';
import { useEffect } from 'react';

export default function GameEmulator({ game }) {
  useEffect(() => {
    // Configure EmulatorJS
    window.EJS_player = '#game';
    window.EJS_gameUrl = game.gameLink; // Use the direct URL from the game object
    window.EJS_core = game.core;
    window.EJS_pathtodata = '/emulatorjs/'; // Path to our local EmulatorJS files
    
    // Load the emulator
    const script = document.createElement('script');
    script.src = '/emulatorjs/loader.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
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
