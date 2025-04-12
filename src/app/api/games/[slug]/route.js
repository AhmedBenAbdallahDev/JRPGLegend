import { NextResponse } from 'next/server';
import { getGameBySlug } from '@/lib/gameQueries';

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Game slug is required' }, 
        { status: 400 }
      );
    }
    
    console.log(`[API] Fetching game with slug: ${slug}`);
    const game = await getGameBySlug(slug);
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(game);
  } catch (error) {
    console.error(`[API] Error fetching game:`, error);
    return NextResponse.json(
      { error: `Failed to fetch game: ${error.message}` }, 
      { status: 500 }
    );
  }
} 