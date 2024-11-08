'use client';
import { useEffect } from 'react';

export default function GameEmulator({ game }) {
  useEffect(() => {
    // Configure EmulatorJS
    window.EJS_player = '#game';
    window.EJS_gameUrl = game.gameLink; // Use the existing gameLink from your database
    window.EJS_core = game.core;
    window.EJS_pathtodata = '/emulatorjs/'; // Local EmulatorJS files
    
    // Load the emulator
    const script = document.createElement('script');
    script.src = '/emulatorjs/loader.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [game]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div id="game" className="aspect-video"></div>
    </div>
  );
}
