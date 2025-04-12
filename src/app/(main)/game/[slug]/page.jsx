"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import GameEmulator from "@/components/GameEmulator";
import Disqus from "@/components/Disqus";
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt, FaBug } from 'react-icons/fa';
import { getOfflineGameBySlug } from "@/lib/offlineGames";
import Head from "next/head";

// Function to get the appropriate icon for each platform category
const getCategoryIcon = (slug) => {
  const iconSize = 24;
  
  switch (slug) {
    case 'nes':
    case 'snes':
      return <FaGamepad size={iconSize} />;
    case 'n64':
      return <FaGamepad size={iconSize} />;
    case 'gb':
    case 'gbc':
    case 'gba':
      return <FaMobileAlt size={iconSize} />;
    case 'nds':
      return <FaGamepad size={iconSize} />;
    case 'genesis':
    case 'segacd':
    case 'saturn':
      return <SiSega size={iconSize} />;
    case 'psx':
    case 'psp':
      return <SiPlaystation size={iconSize} />;
    case 'arcade':
      return <FaGamepad size={iconSize} />;
    default:
      return <FaGamepad size={iconSize} />;
  }
};

export default function GamePage() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { slug } = useParams();

  useEffect(() => {
    async function fetchGameData() {
      if (!slug) {
        setError("No game slug provided");
        setLoading(false);
        return;
      }

      try {
        // First check if it's an offline game
        const offlineGame = getOfflineGameBySlug(slug);
        
        if (offlineGame) {
          console.log("Found offline game:", offlineGame);
          setGame(offlineGame);
          setLoading(false);
          return;
        }

        // If not found locally, fetch from the server API
        const response = await fetch(`/api/games/${slug}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching game: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Online game data comes directly in the response, not in a game property
        setGame(data);
      } catch (error) {
        console.error("Error loading game:", error);
        setError(error.message || "Failed to load game");
      } finally {
        setLoading(false);
      }
    }

    fetchGameData();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-20">
          <div className="spinner"></div>
          <p className="mt-4 text-xl">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <div className="flex items-center">
            <FaBug className="mr-2" />
            <h2 className="text-xl font-bold">Game not found</h2>
          </div>
          <p className="mt-2">{error || "The requested game could not be found."}</p>
          <p className="mt-2">Debug info: Attempted to load game with slug: {slug}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{game.title} - TheNextGamePlatform</title>
        <meta name="description" content={game.description || "Play this retro game online for free"} />
      </Head>

      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-center text-sm">
          <span>Home</span>
          <span className="mx-2">/</span>
          {game.categories && game.categories[0] && (
            <>
              <span>{game.categories[0].name}</span>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="font-semibold">{game.title}</span>
        </div>

        <h1 className="text-3xl font-bold mb-4 flex items-center">
          {game.categories && game.categories[0] && (
            <span className="mr-2">
              {getCategoryIcon(game.categories[0].slug)}
            </span>
          )}
          {game.title}
        </h1>

        <div className="mb-8">
          <GameEmulator game={game} />
        </div>

        <div className="mt-12">
          <Disqus 
            identifier={game.id || game.slug}
            title={game.title}
            url={`https://your-domain.com/game/${game.slug}`}
          />
        </div>
      </div>
    </>
  );
}
