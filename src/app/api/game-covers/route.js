import { getGameCoverUrl as getScreenscraperCoverUrl } from '@/lib/screenscraper';
import { getGameCoverUrl as getTGDBData } from '@/lib/thegamesdb';
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
    const source = searchParams.get('source') || 'screenscraper'; // Default to ScreenScraper
    
    if (!gameName || !core) {
      return NextResponse.json(
        { error: 'Missing required parameters: name and core' },
        { status: 400 }
      );
    }
    
    // Set cache control headers for 30 days to promote longer browser caching
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
      'CDN-Cache-Control': 'max-age=2592000',
      'Vercel-CDN-Cache-Control': 'max-age=2592000',
      'Surrogate-Control': 'max-age=2592000'
    };
    
    // Fetch cover URL from the specified source
    let coverUrl = null;
    
    if (source === 'screenscraper') {
      coverUrl = await getScreenscraperCoverUrl(gameName, core);
    } else if (source === 'tgdb') {
      // For TheGamesDB, we get both metadata and cover URL
      const tgdbData = await getTGDBData(gameName, core);
      if (tgdbData) {
        coverUrl = tgdbData.coverUrl;
      }
    } else if (source === 'auto') {
      // Try ScreenScraper first, then fall back to TheGamesDB
      coverUrl = await getScreenscraperCoverUrl(gameName, core);
      
      if (!coverUrl) {
        const tgdbData = await getTGDBData(gameName, core);
        if (tgdbData) {
          coverUrl = tgdbData.coverUrl;
        }
      }
    }
    
    if (!coverUrl) {
      return NextResponse.json(
        { error: 'No cover image found' },
        { status: 404 }
      );
    }
    
    // Return the cover URL with caching headers
    return NextResponse.json(
      { 
        success: true, 
        coverUrl,
        source: source,
        cached: true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
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