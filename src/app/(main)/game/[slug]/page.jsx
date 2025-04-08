import { getGameBySlug } from "@/lib/gameQueries";
import GameEmulator from "@/components/GameEmulator";
import Disqus from "@/components/Disqus";
import { Suspense } from "react";
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';

export async function generateMetadata({ params }) {
  const game = await getGameBySlug(params.slug);
  const title = game?.title + " - TheNextGamePlatform" || "TheNextGamePlatform Retro Game";
  const description = game?.description || "Discover the best free Retro Games";

  return {
    title,
    description,
  };
}

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

export default async function Page({ params }) {
  const game = await getGameBySlug(params.slug);

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">Game not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="rounded-md w-full mb-4">
        <ol className="list-reset flex">
          <li>
            <a href="/" className="hover:text-accent">Home</a>
          </li>
          <li>
            <span className="text-gray-500 mx-2">/</span>
          </li>
          <li>
            <a 
              href={`/category/${game?.categories[0]?.slug}`} 
              className="hover:text-accent flex items-center gap-1"
            >
              {getCategoryIcon(game?.categories[0]?.slug)}
              {game?.categories[0]?.title}
            </a>
          </li>
          <li>
            <span className="text-gray-500 mx-2">/</span>
          </li>
          <li>
            <span className="text-gray-500">{game?.title}</span>
          </li>
        </ol>
      </nav>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          {game?.title}
          <span className="text-accent">
            {getCategoryIcon(game?.categories[0]?.slug)}
          </span>
        </h1>
        
        <GameEmulator game={game} />
      </div>

      {/* Comments */}
      <div className="mt-8">
        <Suspense fallback={<p>Loading comments...</p>}>
          <Disqus
            url={`${process.env.NEXT_WEBSITE_URL}/game/${game?.slug}`}
            identifier={game?.id}
            title={game?.title}
          />
        </Suspense>
      </div>
    </div>
  );
}
