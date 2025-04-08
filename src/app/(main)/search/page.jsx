import Image from "next/image";
import { getSearchResults } from "@/lib/gameQueries";
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';
import EnhancedGameCover from "@/components/EnhancedGameCover";

// Function to get the appropriate icon for each platform category
const getCategoryIcon = (slug) => {
  const iconSize = 24;
  
  if (!slug) return <FaGamepad size={iconSize} />;
  
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

export default async function Page(req) {
  const searchQuery = req.searchParams.q;

  let games;
  if (searchQuery) {
    games = await getSearchResults(searchQuery);
  } else {
    games = [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl mb-4">
        {searchQuery
          ? `Search results for ${searchQuery}`
          : "No search query provided."}
      </h1>
      <div className="text-accent mb-4">{`${games?.length} results`}</div>

      <ul>
        {games.map((game) => (
          <li key={game.id} className="mb-2">
            <a
              href={`/game/${game.slug}`}
              className="flex gap-4 bg-main hover:bg-accent-secondary p-4 rounded-lg"
            >
              <div className="w-2/6 lg:w-1/6 rounded-md overflow-hidden">
                <EnhancedGameCover
                  game={game}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl">{game.title}</h2>
                  <span className="text-accent">
                    {getCategoryIcon(game.categorySlug)}
                  </span>
                </div>
                <div className="text-sm text-accent">
                  {game.categories?.map((category, index) => (
                    <span key={category.id} className="flex items-center gap-1 inline-block mr-2">
                      {getCategoryIcon(category.slug)}
                      {category.title}
                      {index < game.categories.length - 1 && ", "}
                    </span>
                  ))}
                </div>
                <p className="text-gray-300">{game.description}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>

      {games.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <FaGamepad size={48} className="mx-auto text-accent mb-4" />
          <p className="text-xl">No games found matching your search.</p>
          <p className="text-gray-400 mt-2">Try another search term or browse by platform.</p>
        </div>
      )}
    </div>
  );
}
