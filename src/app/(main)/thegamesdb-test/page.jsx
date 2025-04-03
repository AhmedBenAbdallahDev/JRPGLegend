'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function TheGamesDBTestPage() {
  const [loading, setLoading] = useState(false);
  const [gameTitle, setGameTitle] = useState('Super Mario Bros');
  const [searchResults, setSearchResults] = useState([]);
  const [platform, setPlatform] = useState('nes');
  const [apiSource, setApiSource] = useState('tgdb'); // 'tgdb', 'screenscraper', or 'auto'
  const [apiStatus, setApiStatus] = useState(null);
  const [cacheStats, setCacheStats] = useState({ count: 0, size: 0 });
  const [searchHistory, setSearchHistory] = useState([]);

  // Load cache stats and history on mount
  useEffect(() => {
    updateCacheStats();
    checkApiStatus();
  }, []);

  const updateCacheStats = () => {
    try {
      if (typeof window !== 'undefined') {
        let count = 0;
        let totalSize = 0;
        const history = [];

        // Iterate through localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('cover_')) {
            count++;
            const item = localStorage.getItem(key);
            totalSize += item.length * 2; // Rough estimate of size in bytes
            
            try {
              const { url, timestamp } = JSON.parse(item);
              // Extract source and game name from the key: cover_source:gameName:platform
              const keyParts = key.replace('cover_', '').split(':');
              const source = keyParts[0];
              const gameName = keyParts.length > 1 ? keyParts[1] : 'unknown';
              const date = new Date(timestamp);
              
              // Only include TGDB-related items in history for this page
              let isTGDBImage = source === 'tgdb';
              
              // Check if this is an auto-mode image that resolved to TGDB
              if (source === 'auto' && url && url.includes('thegamesdb')) {
                isTGDBImage = true;
              }
              
              if (isTGDBImage) {
                count++;
                history.push({
                  key,
                  gameName: decodeURIComponent(gameName),
                  date: date.toLocaleDateString(),
                  url,
                  source
                });
              }
            } catch (err) {
              console.error("Error parsing cache item:", err);
            }
          }
        }

        // Sort by most recent first
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setCacheStats({
          count: history.length, // Only count TGDB-related caches for stats
          size: (totalSize / 1024 / 1024).toFixed(2) // Convert to MB
        });
        
        setSearchHistory(history.slice(0, 20)); // Show most recent 20
      }
    } catch (err) {
      console.error("Error calculating cache stats:", err);
    }
  };

  const checkApiStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/thegamesdb/status');
      const data = await response.json();
      setApiStatus(data);
    } catch (error) {
      setApiStatus({
        available: false,
        message: error.message || 'Failed to check API status'
      });
    } finally {
      setLoading(false);
    }
  };

  const purgeAllCache = () => {
    try {
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          // Check for direct TGDB keys
          if (key.startsWith('cover_tgdb:')) {
            keysToRemove.push(key);
          } 
          // Check for auto mode keys that resolved to TGDB
          else if (key.startsWith('cover_auto:')) {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              if (data && data.url && data.url.includes('thegamesdb')) {
                keysToRemove.push(key);
              }
            } catch (e) {
              console.error("Error parsing cache item:", e);
            }
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        setSearchHistory([]);
        updateCacheStats();
        
        alert(`Successfully cleared ${keysToRemove.length} cached covers from TheGamesDB`);
      }
    } catch (err) {
      console.error("Error purging cache:", err);
      alert("Error purging cache: " + err.message);
    }
  };

  const searchGame = async () => {
    if (!gameTitle || !platform) {
      alert('Please enter a game title and select a platform');
      return;
    }
    
    setLoading(true);
    setSearchResults([]);
    
    try {
      // Search for game cover with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        const response = await fetch(
          `/api/game-covers?name=${encodeURIComponent(gameTitle)}&core=${platform}&source=${apiSource}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Try to parse the error response
          let errorData;
          try {
            errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
          } catch (parseError) {
            // If JSON parsing fails, use the status text
            throw new Error(`Server error (${response.status}): ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        
        if (data.success && data.coverUrl) {
          setSearchResults([{
            title: data.gameTitle || gameTitle,
            platform,
            coverUrl: data.coverUrl,
            source: data.source || apiSource
          }]);
          
          // Save to localStorage for permanent caching
          const cacheKey = `${data.source || apiSource}:${encodeURIComponent(gameTitle)}:${platform}`;
          localStorage.setItem(`cover_${cacheKey}`, JSON.stringify({
            url: data.coverUrl,
            title: data.gameTitle || gameTitle,
            timestamp: Date.now()
          }));
          
          // Update stats after adding new cache
          updateCacheStats();
        } else {
          alert('No cover found for this game');
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The server took too long to respond.');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error searching for game cover:', error);
      
      // Provide a more user-friendly error message
      let errorMessage = error.message;
      if (errorMessage.includes('504') || errorMessage.includes('timeout')) {
        errorMessage = 'The request to TheGamesDB timed out. The service might be busy or temporarily unavailable. Please try again later.';
      } else if (errorMessage.includes('Unexpected token')) {
        errorMessage = 'Received an invalid response from the server. TheGamesDB service might be experiencing issues.';
      }
      
      alert('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeCacheItem = (key) => {
    try {
      localStorage.removeItem(key);
      updateCacheStats();
    } catch (err) {
      console.error("Error removing cache item:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Game Cover API Test (TheGamesDB)</h1>
      
      {/* API Status */}
      <div className="bg-main p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">TheGamesDB API Status</h2>
        
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div>
            {apiStatus ? (
              <div>
                <p className={`text-lg font-bold ${apiStatus.available ? 'text-green-500' : 'text-red-500'}`}>
                  Status: {apiStatus.available ? 'Available' : 'Unavailable'}
                </p>
                <p className="text-sm mt-2">{apiStatus.message}</p>
                {apiStatus.platformsCount && (
                  <p className="text-sm mt-1">Platforms available: {apiStatus.platformsCount}</p>
                )}
                <p className="text-sm mt-1">API Key: {apiStatus.apiKey}</p>
              </div>
            ) : (
              <p>Checking API status...</p>
            )}
          </div>
          
          <button
            onClick={checkApiStatus}
            disabled={loading}
            className="bg-accent text-black py-2 px-4 rounded hover:bg-accent/80 disabled:opacity-50"
          >
            Refresh Status
          </button>
        </div>
      </div>
      
      {/* Cache Stats */}
      <div className="bg-main p-4 rounded-lg mb-8">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold mb-2">TheGamesDB Cache Statistics</h2>
            <p>Total Covers Cached: <span className="text-accent font-bold">{cacheStats.count}</span></p>
            <p>Estimated Size: <span className="text-accent font-bold">{cacheStats.size} MB</span></p>
          </div>
          
          <button
            onClick={purgeAllCache}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          >
            Purge TheGamesDB Cache
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mt-2">
          Images are cached permanently in your browser's localStorage.
          This page only shows caches from TheGamesDB (including auto mode that resolved to TheGamesDB).
        </p>
      </div>
      
      {/* Search Form */}
      <div className="bg-main p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Search Game Cover from TheGamesDB</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2">Game Title</label>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              className="w-full p-2 bg-primary border border-accent-secondary rounded"
              placeholder="Enter game title (e.g. Super Mario Bros)"
            />
          </div>
          
          <div>
            <label className="block mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-2 bg-primary border border-accent-secondary rounded"
            >
              <option value="nes">NES</option>
              <option value="snes">SNES</option>
              <option value="n64">Nintendo 64</option>
              <option value="gb">Game Boy</option>
              <option value="gbc">Game Boy Color</option>
              <option value="gba">Game Boy Advance</option>
              <option value="psx">PlayStation</option>
              <option value="segaMD">Sega Genesis/MegaDrive</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">API Source</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="tgdb"
                checked={apiSource === 'tgdb'}
                onChange={() => setApiSource('tgdb')}
                className="mr-2"
              />
              TheGamesDB
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="screenscraper"
                checked={apiSource === 'screenscraper'}
                onChange={() => setApiSource('screenscraper')}
                className="mr-2"
              />
              ScreenScraper
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="auto"
                checked={apiSource === 'auto'}
                onChange={() => setApiSource('auto')}
                className="mr-2"
              />
              Auto (Try Both)
            </label>
          </div>
        </div>
        
        <button
          onClick={searchGame}
          disabled={loading}
          className="bg-accent text-black py-2 px-4 rounded hover:bg-accent/80 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search Cover from TheGamesDB'}
        </button>
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-main p-4 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Search Results</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {searchResults.map((result, index) => (
              <div key={index} className="bg-primary p-2 rounded border border-accent-secondary">
                <h3 className="font-medium text-center mb-2">{result.title}</h3>
                <div className="aspect-[3/4] bg-black mb-2 rounded overflow-hidden">
                  <Image
                    src={result.coverUrl}
                    width={300}
                    height={400}
                    alt={result.title}
                    className="object-contain w-full h-full"
                  />
                </div>
                <p className="text-xs text-center text-accent">
                  Platform: {result.platform}
                </p>
                <p className="text-xs text-center text-green-500">
                  Cached Successfully! (Source: {result.source || 'Unknown'})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cache History */}
      {searchHistory.length > 0 && (
        <div className="bg-main p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Recently Cached TheGamesDB Covers</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {searchHistory.map((item, index) => (
              <div key={index} className="bg-primary p-2 rounded border border-accent-secondary relative">
                <button
                  onClick={() => removeCacheItem(item.key)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  title="Remove from cache"
                >
                  ×
                </button>
                <div className="aspect-[3/4] bg-black mb-2 rounded overflow-hidden">
                  <Image
                    src={item.url}
                    width={150}
                    height={200}
                    alt={item.gameName}
                    className="object-contain w-full h-full"
                  />
                </div>
                <p className="text-xs font-medium truncate">{item.gameName}</p>
                <p className="text-xs text-gray-400">Cached: {item.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 