import { NextResponse } from 'next/server';
import { getGameCoverUrl } from '@/lib/thegamesdb';
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

    // Get game data from TheGamesDB (both metadata and cover URL in one call)
    const gameData = await getGameCoverUrl(name, core);
    
    if (!gameData) {
      // Fallback to ScreenScraper if no results found
      console.log(`No data found in TheGamesDB for ${name} on platform ${core}, falling back to ScreenScraper`);
      return getFallbackResponse(request, name, core, metadataOnly, headers);
    }
    
    // Extract metadata and coverUrl
    const { metadata, coverUrl } = gameData;
    
    // For metadata-only requests, we can return early
    if (metadataOnly) {
      return NextResponse.json(
        { success: true, metadata },
        { status: 200, headers }
      );
    }
    
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