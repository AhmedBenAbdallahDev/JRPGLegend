'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

// Simple in-memory cache for cover URLs to reduce API calls
const coverCache = new Map();

export default function EnhancedGameCover({ 
  game, 
  width = 300, 
  height = 200, 
  className = '',
  source = 'auto' // 'auto', 'tgdb', 'screenscraper'
}) {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if this is a reference to an external API
    if (game.image) {
      if (game.image.startsWith('tgdb:')) {
        fetchTGDBImage(game.image);
        return;
      } else if (game.image.startsWith('screenscraper:')) {
        fetchScreenscraperImage(game.image);
        return;
      } else if (!game.image.includes('default-image')) {
        // Regular local image
        setCoverUrl(`/game/${game.image}`);
        return;
      }
    }

    // No valid image, try to fetch from APIs based on title and core
    if (game.title && game.core) {
      fetchGameCover(source);
    }
  }, [game, source]);

  // Function to fetch image from TheGamesDB based on reference
  const fetchTGDBImage = async (reference) => {
    // Format: tgdb:GameTitle:core
    try {
      // Check cache first
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
      
      const response = await fetch(`/api/game-covers?name=${encodeURIComponent(gameTitle)}&core=${core}&source=tgdb`);
      if (!response.ok) {
        throw new Error('Failed to fetch cover');
      }
      
      const data = await response.json();
      if (data.success && data.coverUrl) {
        setCoverUrl(data.coverUrl);
        coverCache.set(reference, data.coverUrl);
      } else {
        throw new Error('Cover not found');
      }
    } catch (err) {
      console.error('Error fetching TheGamesDB image:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch image from ScreenScraper based on reference
  const fetchScreenscraperImage = async (reference) => {
    // Format: screenscraper:GameTitle:core
    try {
      // Check cache first
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
      
      const response = await fetch(`/api/game-covers?name=${encodeURIComponent(gameTitle)}&core=${core}&source=screenscraper`);
      if (!response.ok) {
        throw new Error('Failed to fetch cover');
      }
      
      const data = await response.json();
      if (data.success && data.coverUrl) {
        setCoverUrl(data.coverUrl);
        coverCache.set(reference, data.coverUrl);
      } else {
        throw new Error('Cover not found');
      }
    } catch (err) {
      console.error('Error fetching ScreenScraper image:', err);
      setError(err.message);
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
    
    // Check cache first
    if (coverCache.has(cacheKey)) {
      setCoverUrl(coverCache.get(cacheKey));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/game-covers?name=${encodeURIComponent(game.title)}&core=${game.core}&source=${preferredSource}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cover');
      }
      const data = await response.json();
      if (data.success && data.coverUrl) {
        setCoverUrl(data.coverUrl);
        coverCache.set(cacheKey, data.coverUrl);
      } else {
        setError('Cover not found');
      }
    } catch (err) {
      console.error('Error fetching game cover:', err);
      setError(err.message);
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
    </div>
  );
} 