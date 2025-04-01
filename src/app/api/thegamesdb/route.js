import { NextResponse } from 'next/server';
import { searchGame, getGameImages, getGameCoverUrl } from '@/lib/thegamesdb';
import { getGameMetadata as getScreenscraperMetadata } from '@/lib/screenscraper';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const core = searchParams.get('core');
    const metadataOnly = searchParams.get('metadataOnly') === 'true';

    if (!name || !core) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: name and core' },
        { status: 400 }
      );
    }

    // Set cache headers
    const headers = {
      'Cache-Control': 'public, max-age=604800', // Cache for 7 days
    };

    // Check if TheGamesDB API key is available
    if (!process.env.TGDB_API_KEY) {
      console.warn('TheGamesDB API key is not set. Falling back to ScreenScraper API.');
      return getFallbackResponse(request, name, core, metadataOnly, headers);
    }

    // Search for the game
    const searchData = await searchGame(name, core);
    
    if (!searchData || !searchData.data || !searchData.data.games || searchData.data.games.length === 0) {
      // Fallback to ScreenScraper if no results found
      return getFallbackResponse(request, name, core, metadataOnly, headers);
    }
    
    // Get the first game result
    const game = searchData.data.games[0];
    const gameId = game.id;
    
    // Get metadata
    const metadata = {
      title: game.game_title,
      description: game.overview || null,
      releaseDate: game.release_date || null,
      developer: game.developers?.[0] || null,
      publisher: game.publishers?.[0] || null,
      genre: game.genres?.join(', ') || null,
      players: game.players || null,
      rating: game.rating || null,
      platformId: game.platform,
      gameId: game.id,
      source: 'thegamesdb'
    };
    
    // For metadata-only requests, we can return early
    if (metadataOnly) {
      return NextResponse.json(
        { success: true, metadata },
        { status: 200, headers }
      );
    }
    
    // Otherwise get the cover image
    const coverUrl = await getGameCoverUrl(name, core);
    
    // Return the full response
    return NextResponse.json(
      { 
        success: true,
        metadata,
        coverUrl 
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error in TheGamesDB API route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get response from ScreenScraper when TheGamesDB fails
async function getFallbackResponse(request, name, core, metadataOnly, headers) {
  try {
    // Try to get data from ScreenScraper
    const requestUrl = new URL(request.url);
    const ssResponse = await fetch(`${requestUrl.origin}/api/screenscraper?name=${encodeURIComponent(name)}&core=${core}&metadataOnly=${metadataOnly}`);
    
    if (ssResponse.ok) {
      const data = await ssResponse.json();
      // Add note that this is fallback data
      if (data.success && data.metadata) {
        data.metadata.source = 'screenscraper (fallback)';
      }
      return NextResponse.json(data, { status: 200, headers });
    }
    
    // If ScreenScraper also fails, return standard error
    return NextResponse.json(
      { success: false, error: 'Game not found' },
      { status: 404, headers }
    );
  } catch (error) {
    console.error('Error in fallback to ScreenScraper:', error);
    return NextResponse.json(
      { success: false, error: 'Game not found' },
      { status: 404, headers }
    );
  }
} 