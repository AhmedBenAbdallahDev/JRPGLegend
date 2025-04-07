import { getGameCoverUrl as getScreenscraperCoverUrl, checkApiStatus as checkScreenscraperStatus } from '@/lib/screenscraper';
import { getGameCoverUrl as getTGDBData, checkApiStatus as checkTGDBStatus } from '@/lib/thegamesdb';
import { getGameCoverFromWikipedia } from '@/lib/wikipedia';
import { NextResponse } from 'next/server';

/**
 * API endpoint to fetch game covers from either ScreenScraper, TheGamesDB, or Wikipedia
 * Caches results to reduce API calls
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const core = searchParams.get('core');
    const source = searchParams.get('source') || 'screenscraper';

    if (!name || !core) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: name and core'
      }, { status: 400 });
    }

    // Get platform ID mapping
    const platformsResponse = await fetch(new URL('/api/screenscraper/platforms', request.url));
    const platformsData = await platformsResponse.json();
    
    if (!platformsData.success) {
      throw new Error('Failed to fetch platform mappings');
    }
    
    const platform = platformsData.platforms.find(p => p.id === core);
    if (!platform) {
      return NextResponse.json({
        success: false,
        error: `Unsupported platform: ${core}`
      }, { status: 400 });
    }

    let gameData;
    let coverUrl;

    switch (source.toLowerCase()) {
      case 'screenscraper':
        try {
          gameData = await getScreenscraperCoverUrl(name, core);
          if (gameData && gameData.images) {
            // Find the first box2d or cover image
            const coverImage = gameData.images.find(img => 
              img.type === 'box2d' || img.type === 'cover'
            );
            coverUrl = coverImage?.url;
          }
        } catch (error) {
          console.error('ScreenScraper error:', error);
          // Fall through to try other sources
        }
        break;

      case 'thegamesdb':
        // TODO: Implement TheGamesDB API
        break;

      case 'wikipedia':
        // TODO: Implement Wikipedia API
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported source: ${source}`
        }, { status: 400 });
    }

    if (!gameData) {
      return NextResponse.json({
        success: false,
        error: 'No game data found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      gameTitle: gameData.name,
      coverUrl,
      gameData,
      source
    });
  } catch (error) {
    console.error('Error in game-covers API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch game cover'
    }, { status: error.status || 500 });
  }
} 