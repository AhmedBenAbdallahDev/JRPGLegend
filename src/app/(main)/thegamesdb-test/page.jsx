'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiSearch, FiDatabase, FiTrash2, FiRefreshCw, FiImage } from 'react-icons/fi';

export default function TheGamesDBTestPage() {
  const [loading, setLoading] = useState(false);
  const [gameTitle, setGameTitle] = useState('Super Mario Bros');
  const [searchResults, setSearchResults] = useState([]);
  const [platform, setPlatform] = useState('nes');
  const [apiSource, setApiSource] = useState('tgdb'); // 'tgdb', 'screenscraper', or 'auto'
  const [apiStatus, setApiStatus] = useState(null);
  const [cacheStats, setCacheStats] = useState({ count: 0, size: 0 });
  const [searchHistory, setSearchHistory] = useState([]);
  const [error, setError] = useState(null);

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
    setError(null);
    
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
          setError('No cover found for this game');
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          setError('Request timed out. The server took too long to respond.');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const removeCacheItem = (key) => {
    try {
      localStorage.removeItem(key);
      setSearchHistory(prevHistory => prevHistory.filter(item => item.key !== key));
      updateCacheStats();
    } catch (err) {
      console.error("Error removing cache item:", err);
    }
  };

  // Platform options for the dropdown
  const platformOptions = [
    { id: 'nes', name: 'Nintendo Entertainment System' },
    { id: 'snes', name: 'Super Nintendo' },
    { id: 'n64', name: 'Nintendo 64' },
    { id: 'gb', name: 'Game Boy' },
    { id: 'gbc', name: 'Game Boy Color' },
    { id: 'gba', name: 'Game Boy Advance' },
    { id: 'nds', name: 'Nintendo DS' },
    { id: 'genesis', name: 'Sega Genesis / Mega Drive' },
    { id: 'segacd', name: 'Sega CD' },
    { id: 'saturn', name: 'Sega Saturn' },
    { id: 'psx', name: 'PlayStation' },
    { id: 'psp', name: 'PlayStation Portable' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-white">TheGamesDB API Test</h1>
      
      {/* API Status */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-white">
          <FiDatabase className="mr-2 text-accent" /> API Status
        </h2>
        
        {apiStatus ? (
          <div className={`p-4 rounded-lg ${apiStatus.available ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
            <p className={`text-lg ${apiStatus.available ? 'text-green-400' : 'text-red-400'}`}>
              Status: {apiStatus.available ? 'Available' : 'Unavailable'}
            </p>
            {apiStatus.message && (
              <p className="mt-1">{apiStatus.message}</p>
            )}
            {apiStatus.apiKey && (
              <p className="mt-1">API Key: {apiStatus.apiKey}</p>
            )}
            {apiStatus.platformsCount && (
              <p className="mt-1">Platforms Available: {apiStatus.platformsCount}</p>
            )}
          </div>
        ) : (
          <div className="animate-pulse flex space-x-4">
            <div className="h-6 bg-gray-700 rounded w-full"></div>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <button 
            onClick={checkApiStatus}
            disabled={loading}
            className="flex items-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh Status
          </button>
        </div>
      </div>
      
      {/* Game Cover Search Form */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-white">
          <FiSearch className="mr-2 text-accent" /> Game Cover Search
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium">Game Title</label>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="Enter game title"
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {platformOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block mb-2 font-medium">API Source</label>
            <select
              value={apiSource}
              onChange={(e) => setApiSource(e.target.value)}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="tgdb">TheGamesDB</option>
              <option value="screenscraper">ScreenScraper</option>
              <option value="auto">Auto (Try Both)</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={searchGame}
              disabled={loading}
              className="w-full flex justify-center items-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <FiSearch className="mr-2" /> Search
                </>
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center text-white">
            <FiImage className="mr-2 text-accent" /> Search Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((result, index) => (
              <div key={index} className="border border-gray-700 rounded-lg p-4 bg-gray-900 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-white">{result.title}</h3>
                <p className="text-sm mb-2">Platform: {result.platform}</p>
                <p className="text-sm mb-2">Source: {result.source}</p>
                
                <div className="relative h-64 mb-2 border border-gray-700 bg-gray-950">
                  <Image 
                    src={result.coverUrl} 
                    alt={result.title}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden items-center justify-center h-full text-red-500">
                    Image failed to load
                  </div>
                </div>
                
                <a 
                  href={result.coverUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm block truncate"
                >
                  View Full Image
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cache Stats */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center text-white">
            <FiDatabase className="mr-2 text-accent" /> Cache Statistics
          </h2>
          
          <button
            onClick={purgeAllCache}
            className="flex items-center bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            <FiTrash2 className="mr-2" /> Clear Cache
          </button>
        </div>
        
        <div className="p-4 bg-gray-900 rounded-lg mb-4">
          <p>TGDB Cached Items: <span className="font-bold">{cacheStats.count}</span></p>
          <p>Estimated Cache Size: <span className="font-bold">{cacheStats.size} MB</span></p>
        </div>
        
        {searchHistory.length > 0 && (
          <>
            <h3 className="text-xl font-bold mb-2 text-white">Recent TheGamesDB Cached Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchHistory.map((item, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-3 bg-gray-900">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-semibold text-sm truncate flex-1">{item.gameName}</h4>
                    <button 
                      onClick={() => removeCacheItem(item.key)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  <p className="text-xs mb-2">Source: {item.source}, Added: {item.date}</p>
                  <div className="relative h-32 mb-2 border border-gray-700 bg-gray-950">
                    <Image 
                      src={item.url} 
                      alt={item.gameName}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center h-full text-red-500">
                      Image failed to load
                    </div>
                  </div>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-xs block truncate"
                  >
                    View Full Image
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 