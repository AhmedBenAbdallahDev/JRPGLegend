import { NextResponse } from 'next/server';

/**
 * API Route for Wikipedia cover image lookup using authenticated API
 * 
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} - API response with cover data or error
 */
export async function GET(request) {
  // Get the search params from the URL
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  const console = searchParams.get('console');
  
  if (!game || !console) {
    return NextResponse.json(
      { error: 'Missing game or console parameter' },
      { status: 400 }
    );
  }
  
  // Authentication credentials from environment variables
  const AUTH_TOKEN = process.env.WIKIMEDIA_AUTH_TOKEN;
  const CLIENT_ID = process.env.WIKIMEDIA_CLIENT_ID;
  
  if (!AUTH_TOKEN || !CLIENT_ID) {
    console.error('[WIKIMEDIA] Missing API credentials in environment variables');
    return NextResponse.json(
      { error: 'API configuration error' },
      { status: 500 }
    );
  }
  
  try {
    // Log API request attempt
    console.log(`[WIKIMEDIA] Searching for game cover: ${game} ${console}`);
    
    // Make a request to the Wikimedia API with authentication
    const wikiApiUrl = 'https://api.wikimedia.org/core/v1/wikipedia/en/search/page';
    
    // Step 1: Search for the game with authenticated API
    const searchParams = new URLSearchParams({
      q: `${game} ${console}`,
      limit: '1'
    });
    
    const searchResponse = await fetch(`${wikiApiUrl}?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Api-User-Agent': 'JRPGLegend/1.0'
      }
    });
    
    if (!searchResponse.ok) {
      console.error(`[WIKIMEDIA] Search API error: ${searchResponse.status}`);
      return NextResponse.json(
        { error: `Wikimedia search API error: ${searchResponse.status}` },
        { status: searchResponse.status }
      );
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.pages || searchData.pages.length === 0) {
      console.warn(`[WIKIMEDIA] No page found for game: ${game} ${console}`);
      return NextResponse.json(
        { error: 'No Wikipedia page found for this game' },
        { status: 404 }
      );
    }
    
    // Get the first search result
    const page = searchData.pages[0];
    
    // Step 2: Get page thumbnail using separate API call
    const pageApiUrl = `https://api.wikimedia.org/core/v1/wikipedia/en/page/${encodeURIComponent(page.key)}/thumbnail`;
    
    const thumbnailResponse = await fetch(pageApiUrl, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Api-User-Agent': 'JRPGLegend/1.0'
      }
    });
    
    if (!thumbnailResponse.ok) {
      console.error(`[WIKIMEDIA] Thumbnail API error: ${thumbnailResponse.status}`);
      return NextResponse.json(
        { error: `Wikimedia thumbnail API error: ${thumbnailResponse.status}` },
        { status: thumbnailResponse.status }
      );
    }
    
    const thumbnailData = await thumbnailResponse.json();
    
    if (!thumbnailData.url) {
      console.warn(`[WIKIMEDIA] No thumbnail found for page: ${page.key}`);
      return NextResponse.json(
        { error: 'No cover image found on Wikipedia page' },
        { status: 404 }
      );
    }
    
    // Step 3: Get page summary for description
    const summaryApiUrl = `https://api.wikimedia.org/core/v1/wikipedia/en/page/${encodeURIComponent(page.key)}/summary`;
    
    const summaryResponse = await fetch(summaryApiUrl, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Api-User-Agent': 'JRPGLegend/1.0'
      }
    });
    
    let extract = '';
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      extract = summaryData.extract || '';
    }
    
    // Log successful API response
    console.log(`[WIKIMEDIA] Successfully retrieved cover for: ${game} ${console}`);
    
    // Return the cover URL and page info
    return NextResponse.json({
      coverUrl: thumbnailData.url,
      title: page.title,
      source: 'wikimedia',
      pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.key)}`,
      extract: extract.substring(0, 300) + (extract.length > 300 ? '...' : ''),
      cached: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=604800',
      }
    });
    
  } catch (error) {
    console.error('[WIKIMEDIA] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch game cover from Wikimedia' },
      { status: 500 }
    );
  }
} 