'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CoverManagerPage() {
  const [loading, setLoading] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [platform, setPlatform] = useState('nes');
  const [cacheStats, setCacheStats] = useState({ count: 0, size: 0 });
  const [searchHistory, setSearchHistory] = useState([]);

  // Load cache stats and history on mount
  useEffect(() => {
    updateCacheStats();
    loadSearchHistory();
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
              const gameName = key.replace('cover_screenscraper:', '').split(':')[0];
              const date = new Date(timestamp);
              
              history.push({
                key,
                gameName: decodeURIComponent(gameName),
                date: date.toLocaleDateString(),
                url
              });
            } catch (err) {
              console.error("Error parsing cache item:", err);
            }
          }
        }

        // Sort by most recent first
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setCacheStats({
          count,
          size: (totalSize / 1024 / 1024).toFixed(2) // Convert to MB
        });
        
        setSearchHistory(history.slice(0, 20)); // Show most recent 20
      }
    } catch (err) {
      console.error("Error calculating cache stats:", err);
    }
  };

  const loadSearchHistory = () => {
    try {
      const savedHistory = localStorage.getItem('cover_search_history');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error("Error loading search history:", err);
    }
  };

  const purgeAllCache = () => {
    try {
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('cover_')) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        setSearchHistory([]);
        updateCacheStats();
        
        alert(`Successfully cleared ${keysToRemove.length} cached covers`);
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
      // Search for game cover
      const response = await fetch(`/api/game-covers?name=${encodeURIComponent(gameTitle)}&core=${platform}&source=screenscraper`);
      const data = await response.json();
      
      if (data.success && data.coverUrl) {
        setSearchResults([{
          title: gameTitle,
          platform,
          coverUrl: data.coverUrl
        }]);
        
        // Save to localStorage for permanent caching
        const cacheKey = `screenscraper:${encodeURIComponent(gameTitle)}:${platform}`;
        localStorage.setItem(`cover_${cacheKey}`, JSON.stringify({
          url: data.coverUrl,
          timestamp: Date.now()
        }));
        
        // Update stats after adding new cache
        updateCacheStats();
      } else {
        alert('No cover found for this game');
      }
    } catch (error) {
      console.error('Error searching for game cover:', error);
      alert('Error: ' + error.message);
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
      <h1 className="text-2xl font-bold mb-6">Game Cover Cache Manager</h1>
      
      {/* Cache Stats */}
      <div className="bg-main p-4 rounded-lg mb-8">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold mb-2">Cache Statistics</h2>
            <p>Total Covers Cached: <span className="text-accent font-bold">{cacheStats.count}</span></p>
            <p>Estimated Size: <span className="text-accent font-bold">{cacheStats.size} MB</span></p>
          </div>
          
          <button
            onClick={purgeAllCache}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          >
            Purge All Cache
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mt-2">
          Images are cached permanently in your browser's localStorage. 
          Use the purge button to clear all cached covers.
        </p>
      </div>
      
      {/* Search Form */}
      <div className="bg-main p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Search Game Cover</h2>
        
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
              <option value="segaCD">Sega CD</option>
              <option value="saturn">Sega Saturn</option>
              <option value="arcade">Arcade</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={searchGame}
          disabled={loading}
          className="bg-accent text-black py-2 px-4 rounded hover:bg-accent/80 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search Cover'}
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
                  Cached Successfully!
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cache History */}
      {searchHistory.length > 0 && (
        <div className="bg-main p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Recently Cached Covers</h2>
          
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