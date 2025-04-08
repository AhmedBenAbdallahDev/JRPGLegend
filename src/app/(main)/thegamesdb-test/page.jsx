'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiSearch, FiDatabase, FiTrash2, FiRefreshCw, FiImage, FiClock, FiInfo, FiAlertCircle, FiServer, FiExternalLink, FiTablet, FiPackage, FiSliders } from 'react-icons/fi';

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
      
    } catch (err) {
      console.error('Error fetching cover:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Returns the status of the selected API
  const getSelectedApiStatus = () => {
    if (apiSource === 'tgdb') {
      return apiStatus;
    } else {
      return { available: true, message: "Using alternate API source" };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-white flex items-center">
        <FiDatabase className="mr-3 text-accent" /> TheGamesDB API Test
      </h1>
      
      {/* API Status */}
      <div className="mb-8 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FiServer className="mr-2 text-blue-400" /> API Status
          </h2>
          
          <button 
            onClick={checkApiStatus} 
            disabled={loading}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
        
        {apiStatus ? (
          <div className={`p-4 rounded-lg mb-4 ${apiStatus.available ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
            <p className={`text-lg ${apiStatus.available ? 'text-green-400' : 'text-red-400'} flex items-center`}>
              {apiStatus.available ? (
                <span className="flex items-center"><FiInfo className="mr-2" /> Available</span>
              ) : (
                <span className="flex items-center"><FiAlertCircle className="mr-2" /> Unavailable</span>
              )}
            </p>
            <p className="mt-2 text-gray-300">{apiStatus.message}</p>
            
            {apiStatus.apiKey && (
              <p className="mt-2 text-sm text-gray-400">API Key: {apiStatus.apiKey}</p>
            )}
            
            {apiStatus.platformsCount && (
              <p className="mt-1 text-sm text-gray-400">Platforms Available: {apiStatus.platformsCount}</p>
            )}
          </div>
        ) : (
          <div className="animate-pulse flex space-x-4 mb-4">
            <div className="h-6 bg-gray-700 rounded w-full"></div>
          </div>
        )}
        
        {/* Cache Stats */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3 text-white flex items-center">
            <FiPackage className="mr-2 text-blue-400" /> Cache Statistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Cached Covers</p>
              <p className="text-2xl font-bold text-white">{cacheStats.count}</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Cache Size</p>
              <p className="text-2xl font-bold text-white">{cacheStats.size} MB</p>
            </div>
          </div>
          <button
            onClick={purgeAllCache}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 flex items-center"
          >
            <FiTrash2 className="mr-2" /> Clear TheGamesDB Cache
          </button>
        </div>
      </div>

      {/* Game Search */}
      <div className="mb-8 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
          <FiSearch className="mr-2 text-blue-400" /> Game Cover Search
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <FiInfo className="mr-1" /> Game Title
            </label>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              className="w-full p-3 border border-gray-700 rounded bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter game title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <FiTablet className="mr-1" /> Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-3 border border-gray-700 rounded bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="nes">NES</option>
              <option value="snes">SNES</option>
              <option value="n64">Nintendo 64</option>
              <option value="gc">GameCube</option>
              <option value="wii">Wii</option>
              <option value="gb">Game Boy</option>
              <option value="gba">Game Boy Advance</option>
              <option value="nds">Nintendo DS</option>
              <option value="3ds">Nintendo 3DS</option>
              <option value="genesis">Sega Genesis</option>
              <option value="saturn">Sega Saturn</option>
              <option value="dreamcast">Dreamcast</option>
              <option value="psx">PlayStation</option>
              <option value="ps2">PlayStation 2</option>
              <option value="ps3">PlayStation 3</option>
              <option value="psp">PlayStation Portable</option>
              <option value="xbox">Xbox</option>
              <option value="xbox360">Xbox 360</option>
              <option value="mame">Arcade (MAME)</option>
              <option value="pce">PC Engine / TurboGrafx-16</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <FiSliders className="mr-1" /> API Source
            </label>
            <select
              value={apiSource}
              onChange={(e) => setApiSource(e.target.value)}
              className="w-full p-3 border border-gray-700 rounded bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="tgdb">TheGamesDB</option>
              <option value="screenscraper">ScreenScraper</option>
              <option value="auto">Auto (Try both)</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={searchGame}
          disabled={loading || !getSelectedApiStatus()?.available}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </span>
          ) : (
            <span className="flex items-center">
              <FiSearch className="mr-2" /> Search Game
            </span>
          )}
        </button>
        
        {error && (
          <div className="mt-4 bg-red-900/30 text-red-200 rounded-lg border border-red-700 p-4 flex items-center">
            <FiAlertCircle className="mr-2 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
      
      {/* Search Results */}
      {searchResults && searchResults.length > 0 && (
        <div className="mb-8 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
            <FiImage className="mr-2 text-blue-400" /> Search Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {searchResults.map((result, index) => (
              <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold mb-2 text-white">{result.title}</h3>
                <p className="text-sm text-gray-400 mb-3">Source: {result.source} • Platform: {result.platform}</p>
                
                <div className="relative h-64 bg-gray-950 border border-gray-700 rounded overflow-hidden mb-3">
                  <Image 
                    src={result.coverUrl} 
                    alt={result.title}
                    fill
                    className="object-contain"
                  />
                </div>
                
                <a 
                  href={result.coverUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm block truncate flex items-center"
                >
                  <FiExternalLink className="mr-1 flex-shrink-0" /> {result.coverUrl}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Cache Activity */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
          <FiClock className="mr-2 text-blue-400" /> Recent Cache Activity
        </h2>
        
        {searchHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchHistory.map((item, index) => (
              <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-md font-semibold text-white truncate">{item.gameName}</h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{item.date}</span>
                </div>
                
                <div className="relative h-40 bg-gray-950 border border-gray-700 rounded mb-2">
                  <Image 
                    src={item.url} 
                    alt={item.gameName}
                    fill
                    className="object-contain"
                  />
                </div>
                
                <p className="text-xs text-gray-400">Source: {item.source}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No cached TheGamesDB covers found.</p>
        )}
      </div>
    </div>
  );
} 