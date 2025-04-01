import { getGamesByCategory, getCategoryBySlug } from '@/lib/gameQueries';
import EnhancedGameCover from '@/components/EnhancedGameCover';
import { SiNintendo, SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';

// Function to get the appropriate icon for each platform category
const getCategoryIcon = (slug) => {
  const iconSize = 28;
  
  if (!slug) return <FaGamepad size={iconSize} />;
  
  switch (slug) {
    case 'nes':
    case 'snes':
      return <SiNintendo size={iconSize} />;
    case 'n64':
      return <SiNintendo size={iconSize} />;
    case 'gb':
    case 'gbc':
    case 'gba':
      return <FaMobileAlt size={iconSize} />;
    case 'nds':
      return <SiNintendo size={iconSize} />;
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

export default async function Page({ params, searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const { games, totalPages, currentPage } = await getGamesByCategory(params.slug, page);
  const category = await getCategoryBySlug(params.slug);

  return(
    <div>
      <h1 className='font-display text-3xl mb-4 capitalize flex items-center gap-2'>
        <span className="text-accent">{getCategoryIcon(params.slug)}</span>
        {category?.title || params.slug}
      </h1>
      <nav className='rounded-md w-full mb-4'>
        <ol className='list-reset flex'>
          <li>
            <a href='/' className="hover:text-accent">Home</a>
          </li>
          <li>
            <span className='text-gray-500 mx-2'>/</span>
          </li>
          <li className='text-gray-500 capitalize flex items-center gap-1'>
            <span className="text-accent">{getCategoryIcon(params.slug)}</span>
            {category?.title || params.slug}
          </li>
        </ol>
      </nav>

      {category?.description && (
        <div className="bg-main p-4 rounded-lg mb-6">
          <p className="text-gray-300">{category.description}</p>
        </div>
      )}

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
        {games.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <FaGamepad size={48} className="mx-auto text-accent mb-4" />
            <p className="text-xl">No games found in this category.</p>
            <p className="text-gray-400 mt-2">Try browsing other platforms or adding a game.</p>
          </div>
        ) : (
          games.map((game) => (
            <a href={`/game/${game.slug}`} key={game.id} className='group'>
              <div className='overflow-hidden rounded-lg border-accent-secondary border mb-2'>
                <EnhancedGameCover 
                  game={game} 
                  width={300}
                  height={300}
                  className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                />
              </div>
              <h1 className='font-medium'>{game.title}</h1>
            </a>
          ))
        )}
      </div>


      {totalPages > 1 && (
        <div className='flex justify-center mt-8'>
          <nav className='inline-flex rounded-md shadow'>
            {currentPage > 1 && (
              <a href={`/category/${params.slug}?page=${currentPage - 1}`}
              className='px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50'>
                Previous
              </a>
            )}
            {[...Array(totalPages).keys()].map((pageNum) => (
              <a href={`/category/${params.slug}?page=${pageNum + 1}`}
              key={pageNum + 1}
              className={`px-3 py-2 border border-gray-300 bg-white text-sm font-medium ${
                currentPage === pageNum + 1
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {pageNum + 1}
              </a>
            ))}

            {currentPage < totalPages && (
              <a href={`/category/${params.slug}?page=${currentPage + 1}`}
              className='px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium 
              text-gray-500 hover:bg-gray-50'>
                Next
              </a>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}