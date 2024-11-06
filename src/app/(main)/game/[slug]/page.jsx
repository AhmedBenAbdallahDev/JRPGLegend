import { getGameBySlug } from "@/lib/gameQueries";
import GameEmulator from "@/components/GameEmulator";
import Disqus from "@/components/Disqus";
import { Suspense } from "react";

export async function generateMetadata({ params }) {
  const game = await getGameBySlug(params.slug);
  const title = game?.title + " - TheNextGamePlatform" || "TheNextGamePlatform Retro Game";
  const description = game?.description || "Discover the best free Retro Games";

  return {
    title,
    description,
  };
}

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
              className="hover:text-accent"
            >
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
