import { getGameCoverUrl, getGameMetadata } from '@/lib/screenscraper';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const gameName = url.searchParams.get('name');
    const core = url.searchParams.get('core');
    const metadataOnly = url.searchParams.get('metadataOnly') === 'true';
    const checkStatus = url.searchParams.get('checkStatus') === 'true';

    // Special case for status check
    if (checkStatus) {
      try {
        // Test connection by requesting Mario for NES as a common game
        const testCover = await getGameCoverUrl('Super Mario Bros', 'nes');
        return NextResponse.json({
          success: true,
          status: 'connected',
          credentials: {
            user: process.env.SCREENSCRAPER_USER,
            // Don't include the actual password in the response
            hasPassword: !!process.env.SCREENSCRAPER_PASSWORD,
          },
          testGameFound: !!testCover
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          status: 'error',
          message: error.message,
          credentials: {
            user: process.env.SCREENSCRAPER_USER,
            hasPassword: !!process.env.SCREENSCRAPER_PASSWORD,
          }
        });
      }
    }

    if (!gameName || !core) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (metadataOnly) {
      // Return full metadata including cover URL
      const metadata = await getGameMetadata(gameName, core);
      if (!metadata) {
        return NextResponse.json({ error: 'Game metadata not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, metadata });
    } else {
      // Return just the cover URL
      const coverUrl = await getGameCoverUrl(gameName, core);
      if (!coverUrl) {
        return NextResponse.json({ error: 'Cover not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, coverUrl });
    }
  } catch (error) {
    console.error('Error in ScreenScraper API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 