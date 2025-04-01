import { getGameCoverUrl, getGameMetadata } from '@/lib/screenscraper';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const gameName = url.searchParams.get('name');
    const core = url.searchParams.get('core');
    const metadataOnly = url.searchParams.get('metadataOnly') === 'true';

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