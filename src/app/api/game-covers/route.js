import { getGameCoverUrl as getScreenscraperCoverUrl } from '@/lib/screenscraper';
import { getGameCoverUrl as getTGDBCoverUrl } from '@/lib/thegamesdb';
import { NextResponse } from 'next/server';

/**
 * API endpoint to fetch game covers from either ScreenScraper or TheGamesDB
 * Caches results to reduce API calls
 */
export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = new URL(request.url).searchParams;
    const gameName = searchParams.get('name');
    const core = searchParams.get('core');
    const source = searchParams.get('source') || 'tgdb'; // Default to TheGamesDB
    
    if (!gameName || !core) {
      return NextResponse.json(
        { error: 'Missing required parameters: name and core' },
        { status: 400 }
      );
    }
    
    // Set cache control headers for 7 days
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=604800, s-maxage=604800',
      'CDN-Cache-Control': 'max-age=604800',
      'Vercel-CDN-Cache-Control': 'max-age=604800'
    };
    
    // Fetch cover URL from the specified source
    let coverUrl = null;
    
    if (source === 'screenscraper') {
      coverUrl = await getScreenscraperCoverUrl(gameName, core);
    } else if (source === 'tgdb') {
      coverUrl = await getTGDBCoverUrl(gameName, core);
    } else {
      // Try both sources if unspecified or invalid
      coverUrl = await getTGDBCoverUrl(gameName, core) || 
                 await getScreenscraperCoverUrl(gameName, core);
    }
    
    if (!coverUrl) {
      return NextResponse.json(
        { error: 'No cover image found' },
        { status: 404 }
      );
    }
    
    // Return the cover URL with caching headers
    return NextResponse.json(
      { success: true, coverUrl },
      { headers: cacheHeaders }
    );
    
  } catch (error) {
    console.error('Error fetching game cover:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 