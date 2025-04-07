'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GameEmulator from '@/components/GameEmulator';
import Link from 'next/link';
import GameImage from '@/components/GameImage';

export default function PlayGamePage() {
  const searchParams = useSearchParams();
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    try {
      const gameParam = searchParams.get('game');
      
      if (!gameParam) {
        setError('No game specified');
        return;
      }
      
      const parsedGame = JSON.parse(decodeURIComponent(gameParam));
      
      if (!parsedGame.title || !parsedGame.gameLink || !parsedGame.core) {
        setError('Invalid game data');
        return;
      }
      
      setGame(parsedGame);
    } catch (err) {
      setError('Failed to load game data');
      console.error('Error loading game:', err);
    }
  }, [searchParams]);
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-6 bg-red-900/50 text-red-200 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <div className="mt-4">
            <Link 
              href="/settings" 
              className="bg-accent hover:bg-accent/80 text-black px-4 py-2 rounded"
            >
              Return to Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-6 bg-gray-800 text-white rounded-lg text-center">
          <p>Loading game...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-16 h-16 relative mr-4">
            <GameImage
              title={game.title}
              core={game.core}
              imageLink={game.imageLink}
              alt={game.title}
              width={64}
              height={64}
              className="rounded"
              onLoad={(imageUrl) => {
                // If we found an image from wikimedia and there's no imageLink,
                // we could update the game object in localStorage
                if (!game.imageLink && imageUrl) {
                  try {
                    console.log(`[Play] Got image from Wikimedia for ${game.title}`);
                    
                    // Create a Wikimedia flag instead of storing the full URL
                    const wikimediaFlag = `wikimedia:${encodeURIComponent(game.title)}`;
                    
                    const consoleId = game.core;
                    const gamesFromStorage = localStorage.getItem(`games_${consoleId}`);
                    
                    if (gamesFromStorage) {
                      const games = JSON.parse(gamesFromStorage);
                      const updatedGames = games.map(g => 
                        g.id === game.id ? { ...g, imageLink: wikimediaFlag } : g
                      );
                      
                      localStorage.setItem(`games_${consoleId}`, JSON.stringify(updatedGames));
                      console.log(`[Play] Saved Wikimedia flag for ${game.title}: ${wikimediaFlag}`);
                    }
                  } catch (err) {
                    console.error('[Play] Error saving Wikimedia flag to localStorage:', err);
                  }
                }
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-white">{game.title}</h1>
        </div>
        <Link 
          href="/settings" 
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Back to Settings
        </Link>
      </div>
      
      <GameEmulator game={game} />
    </div>
  );
} 