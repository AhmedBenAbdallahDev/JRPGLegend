import { getGamesByCategory, getCategoryBySlug } from '@/lib/gameQueries';
import CategoryContent from './CategoryContent';

export default async function CategoryPage({ params, searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  // Load the online games and category from the server
  const { games, totalPages, currentPage } = await getGamesByCategory(params.slug, page);
  const category = await getCategoryBySlug(params.slug);

  return (
    <CategoryContent 
      slug={params.slug}
      initialOnlineGames={games || []}
      totalPages={totalPages || 1}
      currentPage={currentPage || 1}
      initialCategory={category || { 
        title: params.slug.replace(/-/g, ' '),
        slug: params.slug
      }}
      page={page}
    />
  );
}