'use client';

import { useState } from 'react';
import GameCover from '@/components/GameCover';

export default function ScreenScraperDemo() {
  const [gameTitle, setGameTitle] = useState('');
  const [core, setCore] = useState('snes');
  const [game, setGame] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!gameTitle || !core) {
      setError('Please provide both game title and platform');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/screenscraper?name=${encodeURIComponent(gameTitle)}&core=${core}&metadataOnly=true`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.metadata) {
        setMetadata(data.metadata);
        setGame({
          title: gameTitle,
          core: core,
          // We don't set image here so it'll use ScreenScraper
        });
      } else {
        setError('No game metadata found');
        setMetadata(null);
        setGame(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setMetadata(null);
      setGame(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-2xl md:text-3xl mb-6">ScreenScraper Integration Demo</h1>
      
      <div className="mb-8 bg-main p-6 rounded-xl">
        <h2 className="text-xl mb-4">Search for Game Metadata</h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block mb-2">Game Title</label>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              className="w-full p-3 rounded bg-primary border border-accent-secondary"
              placeholder="e.g. Super Mario World"
            />
          </div>
          
          <div>
            <label className="block mb-2">Platform</label>
            <select
              value={core}
              onChange={(e) => setCore(e.target.value)}
              className="w-full p-3 rounded bg-primary border border-accent-secondary"
            >
              <option value="snes">Super Nintendo (SNES)</option>
              <option value="nes">Nintendo Entertainment System (NES)</option>
              <option value="gba">Game Boy Advance (GBA)</option>
              <option value="n64">Nintendo 64</option>
              <option value="segamd">Sega Genesis / Mega Drive</option>
              <option value="psx">PlayStation</option>
              <option value="arcade">Arcade</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-black p-3 rounded-xl font-medium hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded">
            {error}
          </div>
        )}
      </div>
      
      {game && metadata && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl mb-4">Game Cover</h2>
            <div className="w-full max-w-xs">
              <GameCover 
                game={game} 
                width={500} 
                height={700} 
                className="w-full aspect-[3/4]"
              />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl mb-4">Game Metadata</h2>
            <div className="bg-main p-6 rounded-xl">
              <h3 className="text-2xl text-accent mb-2">{metadata.title}</h3>
              
              {metadata.description && (
                <div className="mb-4">
                  <h4 className="font-bold mb-1">Description</h4>
                  <p>{metadata.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {metadata.developer && (
                  <div>
                    <h4 className="font-bold mb-1">Developer</h4>
                    <p>{metadata.developer}</p>
                  </div>
                )}
                
                {metadata.publisher && (
                  <div>
                    <h4 className="font-bold mb-1">Publisher</h4>
                    <p>{metadata.publisher}</p>
                  </div>
                )}
                
                {metadata.releaseDate && (
                  <div>
                    <h4 className="font-bold mb-1">Release Date</h4>
                    <p>{metadata.releaseDate}</p>
                  </div>
                )}
                
                {metadata.genre && (
                  <div>
                    <h4 className="font-bold mb-1">Genre</h4>
                    <p>{metadata.genre}</p>
                  </div>
                )}
                
                {metadata.players && (
                  <div>
                    <h4 className="font-bold mb-1">Players</h4>
                    <p>{metadata.players}</p>
                  </div>
                )}
                
                {metadata.rating && (
                  <div>
                    <h4 className="font-bold mb-1">Rating</h4>
                    <p>{metadata.rating}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 