'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

// Simple in-memory cache for cover URLs to reduce API calls during the session
const coverCache = new Map();

export default function EnhancedGameCover({ 
  game, 
  width = 300, 
  height = 200, 
  className = '',
  source = 'screenscraper' // Default to screenscraper. Options: 'screenscraper', 'tgdb', or 'auto' (tries screenscraper first, then tgdb)
}) {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cacheDate, setCacheDate] = useState(null);

  useEffect(() => {
    // Function to check localStorage cache - permanent storage
    const checkLocalCache = (cacheKey) => {
      try {
        if (typeof window !== 'undefined') {
          const cachedData = localStorage.getItem(`cover_${cacheKey}`);
          if (cachedData) {
            const { url, timestamp } = JSON.parse(cachedData);
            
            // No expiration check - cache is permanent
            setCacheDate(new Date(timestamp).toLocaleDateString());
            return url;
          }
        }
        return null;
      } catch (err) {
        console.error("Error reading from localStorage:", err);
        return null;
      }
    };

    // Function to save to localStorage cache
    const saveToLocalCache = (cacheKey, url) => {
      try {
        if (typeof window !== 'undefined') {
          const data = {
            url,
            timestamp: Date.now()
          };
          localStorage.setItem(`cover_${cacheKey}`, JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error saving to localStorage:", err);
      }
    };

    const attemptImageFetch = () => {
      // First try existing image reference formats
      if (game.image) {
        if (game.image.startsWith('tgdb:')) {
          const cachedUrl = checkLocalCache(game.image);
          if (cachedUrl) {
            setCoverUrl(cachedUrl);
            coverCache.set(game.image, cachedUrl);
          } else {
            fetchTGDBImage(game.image);
          }
          return true;
        } else if (game.image.startsWith('screenscraper:')) {
          const cachedUrl = checkLocalCache(game.image);
          if (cachedUrl) {
            setCoverUrl(cachedUrl);
            coverCache.set(game.image, cachedUrl);
          } else {
            fetchScreenscraperImage(game.image);
          }
          return true;
        } else if (!game.image.includes('default-image')) {
          // Regular local image
          setCoverUrl(`/game/${game.image}`);
          return true;
        }
      }
      
      // If no valid image, try to fetch automatically using title and core
      if (game.title && game.core) {
        // Generate a cache key
        const cacheKey = `${source}:${game.title}:${game.core}`;
        
        const cachedUrl = checkLocalCache(cacheKey);
        if (cachedUrl) {
          setCoverUrl(cachedUrl);
          coverCache.set(cacheKey, cachedUrl);
        } else {
          fetchGameCover(source);
        }
        return true;
      }
      
      return false;
    };

    // Start the fetch process
    attemptImageFetch();
    
  }, [game, source]);

  // Function to fetch image from TheGamesDB based on reference
  const fetchTGDBImage = async (reference) => {
    // Format: tgdb:GameTitle:core
    try {
      // Check in-memory cache first
      if (coverCache.has(reference)) {
        setCoverUrl(coverCache.get(reference));
        return;
      }

      setLoading(true);
      const parts = reference.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid TheGamesDB reference format');
      }
      
      const gameTitle = decodeURIComponent(parts[1]);
      const core = parts[2];
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        const response = await fetch(
          `/api/game-covers?name=${encodeURIComponent(gameTitle)}&core=${core}&source=tgdb`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch cover: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.coverUrl) {
          setCoverUrl(data.coverUrl);
          coverCache.set(reference, data.coverUrl);
          
          // Cache in localStorage permanently
          try {
            if (typeof window !== 'undefined') {
              const cacheData = {
                url: data.coverUrl,
                title: data.gameTitle || gameTitle,
                timestamp: Date.now()
              };
              localStorage.setItem(`cover_${reference}`, JSON.stringify(cacheData));
              setCacheDate(new Date().toLocaleDateString());
            }
          } catch (err) {
            console.error("Error saving to localStorage:", err);
          }
        } else {
          throw new Error(data.error || 'Cover not found');
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The API may be unavailable.');
        } else {
          throw fetchError;
        }
      }
    } catch (err) {
      console.error('Error fetching TheGamesDB image:', err);
      // Use a more user-friendly error message
      const errorMessage = err.message && (
        err.message.includes('timeout') || err.message.includes('504')
      ) ? 'API timeout' : 'Cover unavailable';
      
      setError(errorMessage);
      
      // Try to fall back to ScreenScraper if TheGamesDB failed
      try {
        const parts = reference.split(':');
        if (parts.length === 3) {
          const gameTitle = decodeURIComponent(parts[1]);
          const core = parts[2];
          
          const fallbackResponse = await fetch(`/api/game-covers?name=${encodeURIComponent(gameTitle)}&core=${core}&source=screenscraper`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.success && fallbackData.coverUrl) {
              setCoverUrl(fallbackData.coverUrl);
              coverCache.set(reference, fallbackData.coverUrl);
              setError(null);
            }
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback to ScreenScraper also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch image from ScreenScraper based on reference
  const fetchScreenscraperImage = async (reference) => {
    // Format: screenscraper:GameTitle:core
    try {
      // Check in-memory cache first
      if (coverCache.has(reference)) {
        setCoverUrl(coverCache.get(reference));
        return;
      }

      setLoading(true);
      const parts = reference.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ScreenScraper reference format');
      }
      
      const gameTitle = decodeURIComponent(parts[1]);
      const core = parts[2];
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        const response = await fetch(
          `/api/game-covers?name=${encodeURIComponent(gameTitle)}&core=${core}&source=screenscraper`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch cover: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.coverUrl) {
          setCoverUrl(data.coverUrl);
          coverCache.set(reference, data.coverUrl);
          
          // Cache in localStorage permanently
          try {
            if (typeof window !== 'undefined') {
              const cacheData = {
                url: data.coverUrl,
                title: data.gameTitle || gameTitle,
                timestamp: Date.now()
              };
              localStorage.setItem(`cover_${reference}`, JSON.stringify(cacheData));
              setCacheDate(new Date().toLocaleDateString());
            }
          } catch (err) {
            console.error("Error saving to localStorage:", err);
          }
        } else {
          throw new Error(data.error || 'Cover not found');
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The ScreenScraper API may be unavailable.');
        } else {
          throw fetchError;
        }
      }
    } catch (err) {
      console.error('Error fetching ScreenScraper image:', err);
      // Use a more user-friendly error message
      const errorMessage = err.message && (
        err.message.includes('timeout') || err.message.includes('504')
      ) ? 'API timeout' : 'Cover unavailable';
      
      setError(errorMessage);
      
      // Try to fall back to TheGamesDB if ScreenScraper failed
      try {
        const parts = reference.split(':');
        if (parts.length === 3) {
          const gameTitle = decodeURIComponent(parts[1]);
          const core = parts[2];
          
          const fallbackResponse = await fetch(`/api/game-covers?name=${encodeURIComponent(gameTitle)}&core=${core}&source=tgdb`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.success && fallbackData.coverUrl) {
              setCoverUrl(fallbackData.coverUrl);
              coverCache.set(reference, fallbackData.coverUrl);
              setError(null);
            }
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback to TheGamesDB also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch game cover based on title and core
  const fetchGameCover = async (preferredSource) => {
    if (!game.title || !game.core) {
      setError('Missing game title or core');
      return;
    }

    // Generate a cache key
    const cacheKey = `${preferredSource}:${game.title}:${game.core}`;
    
    // Check in-memory cache first
    if (coverCache.has(cacheKey)) {
      setCoverUrl(coverCache.get(cacheKey));
      return;
    }

    setLoading(true);
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        const response = await fetch(
          `/api/game-covers?name=${encodeURIComponent(game.title)}&core=${game.core}&source=${preferredSource}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch cover: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.coverUrl) {
          setCoverUrl(data.coverUrl);
          coverCache.set(cacheKey, data.coverUrl);
          
          // Cache in localStorage permanently
          try {
            if (typeof window !== 'undefined') {
              const cacheData = {
                url: data.coverUrl,
                title: data.gameTitle || game.title,
                source: data.source || preferredSource,
                timestamp: Date.now()
              };
              localStorage.setItem(`cover_${cacheKey}`, JSON.stringify(cacheData));
              setCacheDate(new Date().toLocaleDateString());
            }
          } catch (err) {
            console.error("Error saving to localStorage:", err);
          }
        } else {
          throw new Error(data.error || 'Cover not found');
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The API may be unavailable.');
        } else {
          throw fetchError;
        }
      }
    } catch (err) {
      console.error('Error fetching game cover:', err);
      // Use a more user-friendly error message that doesn't break the UI
      const errorMessage = err.message && (
        err.message.includes('timeout') || err.message.includes('504')
      ) ? 'API timeout' : 'Cover unavailable';
      
      setError(errorMessage);
      
      // Try to fall back to the other API if this was screenscraper and failed
      if (preferredSource === 'screenscraper' && game.title && game.core) {
        console.log('Falling back to TheGamesDB after ScreenScraper failure');
        try {
          const fallbackResponse = await fetch(`/api/game-covers?name=${encodeURIComponent(game.title)}&core=${game.core}&source=tgdb`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.success && fallbackData.coverUrl) {
              setCoverUrl(fallbackData.coverUrl);
              coverCache.set(cacheKey, fallbackData.coverUrl);
              setError(null);
            }
          }
        } catch (fallbackErr) {
          console.error('Fallback to TheGamesDB also failed:', fallbackErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Default image if nothing else is available
  const defaultImage = '/game/default-image.png';

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full"></div>
        </div>
      )}
      
      <Image
        src={coverUrl || defaultImage}
        width={width}
        height={height}
        alt={game.title || 'Game Cover'}
        quality={80}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        onError={() => setCoverUrl(defaultImage)}
      />
      
      {error && !coverUrl && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-accent text-xs p-1 text-center">
          {error}
        </div>
      )}
      
      {cacheDate && coverUrl && (
        <div className="absolute top-0 right-0 bg-green-500/80 text-white text-xs px-1 py-0.5 rounded-bl">
          Cached
        </div>
      )}
    </div>
  );
}

// Update the fetchGameCover function to include Wikipedia option
export async function fetchGameCover(gameTitle, core, preferredSource = 'auto') {
  // Skip fetch if parameters are missing
  if (!gameTitle || !core) return null;

  try {
    // Generate a cache key based on game title, core, and preferred source
    const cacheKey = `game_cover_${preferredSource}_${gameTitle.toLowerCase()}_${core}`;
    
    // Check in-memory cache first
    if (coverCache[cacheKey]) {
      return coverCache[cacheKey];
    }
    
    // Check localStorage cache next (if available)
    if (typeof localStorage !== 'undefined') {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          // Check if cache is expired (7 days)
          const now = new Date();
          const cacheTime = new Date(parsedData.timestamp);
          const cacheAge = now - cacheTime;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          
          if (cacheAge < maxAge) {
            // Add to memory cache
            coverCache[cacheKey] = parsedData;
            return parsedData;
          }
        } catch (e) {
          console.error('Error parsing cached cover:', e);
          // Invalid cache, continue to fetch
        }
      }
    }
    
    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    // Use source parameter to specify the API source
    const queryParams = new URLSearchParams({
      name: gameTitle,
      core: core,
      source: preferredSource
    });
    
    try {
      const response = await fetch(`/api/game-covers?${queryParams.toString()}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle API errors
        if (response.status === 404) {
          throw new Error('No cover found for this game');
        } else if (response.status === 503) {
          throw new Error('Game cover API is temporarily unavailable');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      if (data && data.coverUrl) {
        // Create result object
        const result = {
          coverUrl: data.coverUrl,
          title: data.gameTitle || gameTitle,
          source: data.source || preferredSource,
          timestamp: new Date().toISOString()
        };
        
        // Check for Wikipedia page URL if available
        if (data.pageUrl) {
          result.pageUrl = data.pageUrl;
        }
        
        // Add to in-memory cache
        coverCache[cacheKey] = result;
        
        // Save to localStorage if available
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {
            console.warn('Failed to cache game cover:', e);
          }
        }
        
        return result;
      } else {
        throw new Error('No cover URL returned from API');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Game cover request timed out');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error fetching game cover:', error);
    
    // If the preferred source is not 'auto' and fails, try 'auto' as fallback
    if (preferredSource !== 'auto') {
      console.warn(`Trying 'auto' source as fallback for ${gameTitle}`);
      try {
        return await fetchGameCover(gameTitle, core, 'auto');
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}

// Update the SourceSelect component to include Wikipedia
function SourceSelect({ value, onChange, disabled }) {
  return (
    <div className="form-select border border-gray-300 rounded p-2 dark:bg-gray-800 dark:border-gray-600">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-transparent w-full outline-none"
      >
        <option value="auto">Auto (Try All Sources)</option>
        <option value="screenscraper">ScreenScraper</option>
        <option value="tgdb">TheGamesDB</option>
        <option value="wikipedia">Wikipedia</option>
      </select>
    </div>
  );
} 