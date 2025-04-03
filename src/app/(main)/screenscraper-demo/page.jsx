'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ScreenscraperDemoPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [gameTitle, setGameTitle] = useState('Super Mario Bros');
  const [platform, setPlatform] = useState('nes');
  const [imageUrl, setImageUrl] = useState(null);
  const [cachingInfo, setCachingInfo] = useState(null);
  const [searchStartTime, setSearchStartTime] = useState(0);
  const [searchDuration, setSearchDuration] = useState(0);

  // Check API status on load
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/screenscraper?checkStatus=true');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({ 
        success: false, 
        error: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const checkLocalStorage = () => {
    try {
      const cacheKey = `screenscraper:${encodeURIComponent(gameTitle)}:${platform}`;
      const cached = localStorage.getItem(`cover_${cacheKey}`);
      if (cached) {
        const { url, timestamp } = JSON.parse(cached);
        const date = new Date(timestamp);
        setCachingInfo({
          exists: true,
          url,
          date: date.toLocaleString(),
          age: Math.round((Date.now() - timestamp) / (1000 * 60 * 60 * 24)) + ' days'
        });
      } else {
        setCachingInfo({ exists: false });
      }
    } catch (error) {
      setCachingInfo({ exists: false, error: error.message });
    }
  };

  const clearCache = () => {
    try {
      // Clear only the current game's cache
      const cacheKey = `screenscraper:${encodeURIComponent(gameTitle)}:${platform}`;
      localStorage.removeItem(`cover_${cacheKey}`);
      setCachingInfo({ exists: false, cleared: true });
      setImageUrl(null);
    } catch (error) {
      setCachingInfo({ error: error.message });
    }
  };

  const clearAllCache = () => {
    try {
      // Find and remove all cover cache items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('cover_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      setCachingInfo({ exists: false, cleared: true, count: keysToRemove.length });
      setImageUrl(null);
    } catch (error) {
      setCachingInfo({ error: error.message });
    }
  };

  const searchGame = async () => {
    if (!gameTitle || !platform) return;
    
    try {
      setLoading(true);
      setSearchStartTime(Date.now());
      
      checkLocalStorage(); // Check localStorage before making request
      
      const response = await fetch(`/api/screenscraper?name=${encodeURIComponent(gameTitle)}&core=${platform}`);
      const data = await response.json();
      
      if (data.success && data.coverUrl) {
        setImageUrl(data.coverUrl);
        setSearchDuration(Date.now() - searchStartTime);
      } else {
        setImageUrl(null);
      }
    } catch (error) {
      console.error("Error searching game:", error);
      setImageUrl(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ScreenScraper API Demo</h1>
      
      {/* API Status Check */}
      <div className="mb-8 p-4 bg-main rounded-lg">
        <h2 className="text-xl font-bold mb-2">API Status</h2>
        
        <button 
          onClick={checkApiStatus} 
          className="bg-accent-gradient border border-yellow-500 px-4 py-2 rounded mb-4"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check API Status'}
        </button>
        
        {status && (
          <div className="mt-2">
            <div className={`text-lg font-bold mb-2 ${status.success ? 'text-green-500' : 'text-red-500'}`}>
              Status: {status.success ? 'Connected' : 'Error'}
            </div>
            
            {status.credentials && (
              <div className="mb-2">
                <p>Username: <span className="font-mono">{status.credentials.user}</span></p>
                <p>Password: {status.credentials.hasPassword ? '✓ Set' : '✗ Missing'}</p>
              </div>
            )}
            
            {status.message && (
              <p className="text-red-500">{status.message}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Game Search */}
      <div className="mb-8 p-4 bg-main rounded-lg">
        <h2 className="text-xl font-bold mb-4">Search Game Cover</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2">Game Title</label>
            <input 
              type="text" 
              value={gameTitle} 
              onChange={(e) => setGameTitle(e.target.value)}
              className="w-full p-2 bg-primary border border-accent-secondary rounded"
              placeholder="e.g. Super Mario Bros"
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
              <option value="n64">N64</option>
              <option value="gb">Game Boy</option>
              <option value="gbc">Game Boy Color</option>
              <option value="gba">Game Boy Advance</option>
              <option value="psx">PlayStation</option>
              <option value="segaMD">Sega Genesis/MegaDrive</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={searchGame} 
            className="bg-accent-gradient border border-yellow-500 px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          
          <button 
            onClick={checkLocalStorage}
            className="bg-primary border border-accent px-4 py-2 rounded"
          >
            Check Cache
          </button>
          
          <button 
            onClick={clearCache}
            className="bg-primary border border-red-500 text-red-500 px-4 py-2 rounded"
          >
            Clear This Cache
          </button>
          
          <button 
            onClick={clearAllCache}
            className="bg-primary border border-red-500 text-red-500 px-4 py-2 rounded"
          >
            Clear All Caches
          </button>
        </div>
        
        {/* Cache Info */}
        {cachingInfo && (
          <div className={`mb-4 p-3 rounded ${cachingInfo.exists ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
            <h3 className="font-bold mb-1">Cache Status</h3>
            {cachingInfo.exists ? (
              <div>
                <p>✓ Image found in browser cache</p>
                <p>Cached on: {cachingInfo.date}</p>
                <p>Age: {cachingInfo.age}</p>
              </div>
            ) : cachingInfo.cleared ? (
              <p>Cache cleared successfully {cachingInfo.count ? `(${cachingInfo.count} items)` : ''}</p>
            ) : (
              <p>No cached version found in browser</p>
            )}
            {cachingInfo.error && <p className="text-red-500 mt-1">{cachingInfo.error}</p>}
          </div>
        )}
        
        {/* Result */}
        {imageUrl && (
          <div className="mt-4">
            <h3 className="font-bold mb-2">Image Found</h3>
            <p className="mb-2 text-sm">
              Loaded in: <span className="font-bold">{searchDuration}ms</span>
              {searchDuration < 50 && <span className="text-green-500 ml-2">(Likely from browser cache!)</span>}
            </p>
            <div className="bg-black p-1 rounded max-w-md">
              <Image 
                src={imageUrl} 
                width={300} 
                height={300}
                alt={gameTitle}
                className="max-w-full h-auto rounded"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-400 mt-8">
        <p>Note: This demo page demonstrates the browser-side caching system for game cover images.</p>
        <p>When you search for a game image, it will be cached in your browser's localStorage for up to 7 days.</p>
        <p>Subsequent requests for the same image will be served from cache without making additional API calls.</p>
      </div>
    </div>
  );
} 