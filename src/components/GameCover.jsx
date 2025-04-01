'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function GameCover({ game, width = 300, height = 200, className = '' }) {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If game already has an image, use that
    if (game.image && !game.image.includes('default-image')) {
      setCoverUrl(`/game/${game.image}`);
      return;
    }

    // Otherwise, try to fetch from ScreenScraper
    const fetchGameCover = async () => {
      if (!game.title || !game.core) {
        setError('Missing game title or core');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/screenscraper?name=${encodeURIComponent(game.title)}&core=${game.core}`);
        if (!response.ok) {
          throw new Error('Failed to fetch cover');
        }
        const data = await response.json();
        if (data.success && data.coverUrl) {
          setCoverUrl(data.coverUrl);
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

    fetchGameCover();
  }, [game]);

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