'use client';

import { useState, useEffect } from 'react';
import GameCover from '@/components/GameCover';
import { SiNintendo, SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaInfoCircle } from 'react-icons/fa';

export default function ApiDemoPage() {
  const [gameTitle, setGameTitle] = useState('');
  const [core, setCore] = useState('snes');
  const [game, setGame] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('screenscraper'); // 'screenscraper' or 'thegamesdb'
  const [coverUrl, setCoverUrl] = useState(null);
  const [tgdbKeyMissing, setTgdbKeyMissing] = useState(false);

  // Check if TGDB API is available
  useEffect(() => {
    const checkTgdbAvailability = async () => {
      try {
        const response = await fetch('/api/thegamesdb/status');
        const data = await response.json();
        setTgdbKeyMissing(!data.available);
      } catch (err) {
        console.error('Failed to check TGDB availability');
        setTgdbKeyMissing(true);
      }
    };
    
    checkTgdbAvailability();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!gameTitle || !core) {
      setError('Please provide both game title and platform');
      return;
    }
    
    setLoading(true);
    setError(null);
    setCoverUrl(null);
    
    try {
      // Determine which API to use
      const apiEndpoint = activeTab === 'screenscraper' 
        ? '/api/screenscraper'
        : '/api/thegamesdb';
      
      const response = await fetch(`${apiEndpoint}?name=${encodeURIComponent(gameTitle)}&core=${core}&metadataOnly=true`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.metadata) {
        setMetadata(data.metadata);
        setCoverUrl(data.coverUrl);
        setGame({
          title: gameTitle,
          core: core,
          image: activeTab === 'thegamesdb' 
            ? `tgdb:${gameTitle}:${core}`
            : `screenscraper:${gameTitle}:${core}`
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

  // Get icon for the platform
  const getPlatformIcon = (slug) => {
    const iconSize = 24;
    
    switch (slug) {
      case 'snes':
      case 'nes':
      case 'n64':
        return <SiNintendo size={iconSize} />;
      case 'segaMD':
      case 'segaCD':
      case 'segaSaturn':
        return <SiSega size={iconSize} />;
      case 'psx':
      case 'psp':
        return <SiPlaystation size={iconSize} />;
      default:
        return <FaGamepad size={iconSize} />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-2xl md:text-3xl mb-6">Game API Integration Demo</h1>
      
      {/* API Key Warning Banner */}
      {tgdbKeyMissing && activeTab === 'thegamesdb' && (
        <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500 rounded-lg flex items-start gap-3">
          <FaInfoCircle className="text-amber-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-amber-500">TheGamesDB API Key Missing</h3>
            <p className="text-sm">
              TheGamesDB API key is not configured. The system will automatically fall back to ScreenScraper API.
              To use TheGamesDB API, please <a href="https://thegamesdb.net/member/login.php" target="_blank" rel="noreferrer" className="text-accent underline">register at TheGamesDB</a> and 
              add your API key to the <code className="bg-black/30 px-1 rounded">TGDB_API_KEY</code> variable in your <code className="bg-black/30 px-1 rounded">.env</code> file.
            </p>
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-accent-secondary">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('screenscraper')}
            className={`py-2 px-4 ${
              activeTab === 'screenscraper'
                ? 'border-b-2 border-accent text-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ScreenScraper API
          </button>
          <button
            onClick={() => setActiveTab('thegamesdb')}
            className={`py-2 px-4 ${
              activeTab === 'thegamesdb'
                ? 'border-b-2 border-accent text-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            TheGamesDB API {tgdbKeyMissing && <span className="ml-1 text-amber-500 text-xs">(Fallback Mode)</span>}
          </button>
        </div>
      </div>
      
      <div className="mb-8 bg-main p-6 rounded-xl">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <span className="text-accent">
            {activeTab === 'screenscraper' ? 'ScreenScraper' : 'TheGamesDB'}
          </span>
          <span>Search</span>
        </h2>
        
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
              <option value="segaMD">Sega Genesis / Mega Drive</option>
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
                className="w-full aspect-[3/4] object-contain bg-black/20 rounded-lg"
              />
              <p className="text-xs text-gray-400 mt-2">
                Source: {metadata.source || (activeTab === 'screenscraper' ? 'ScreenScraper API' : 'TheGamesDB API')}
              </p>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl mb-4 flex items-center gap-2">
              Game Metadata
              <span className="text-accent">
                {getPlatformIcon(core)}
              </span>
            </h2>
            <div className="bg-main p-6 rounded-xl">
              <h3 className="text-2xl text-accent mb-2">{metadata.title}</h3>
              
              {metadata.description && (
                <div className="mb-4">
                  <h4 className="font-bold mb-1">Description</h4>
                  <p className="text-gray-300">{metadata.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mt-4">
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