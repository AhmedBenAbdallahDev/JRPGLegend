import { NextResponse } from 'next/server';

/**
 * API Route for Wikipedia cover image lookup
 * 
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} - API response with cover data or error
 */
export async function GET(request) {
  // Get the search params from the URL
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  
  if (!game) {
    return NextResponse.json(
      { error: 'Missing game parameter' },
      { status: 400 }
    );
  }
  
  try {
    // Make a request to the Wikipedia API
    const wikiApiUrl = 'https://en.wikipedia.org/w/api.php';
    
    // Step 1: Search for the game on Wikipedia
    const searchParams = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: `${game} video game`,
      format: 'json',
      srlimit: '1',
      origin: '*',
    });
    
    const searchResponse = await fetch(`${wikiApiUrl}?${searchParams.toString()}`);
    
    if (!searchResponse.ok) {
      return NextResponse.json(
        { error: `Wikipedia search API error: ${searchResponse.status}` },
        { status: searchResponse.status }
      );
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
      return NextResponse.json(
        { error: 'No Wikipedia page found for this game' },
        { status: 404 }
      );
    }
    
    // Get the first search result
    const pageTitle = searchData.query.search[0].title;
    
    // Step 2: Get page details with images
    const pageParams = new URLSearchParams({
      action: 'query',
      titles: pageTitle,
      prop: 'pageimages|info|extracts',
      pithumbsize: '1000', // Request large thumbnail
      format: 'json',
      exintro: '1',
      explaintext: '1',
      inprop: 'url',
      origin: '*',
    });
    
    const pageResponse = await fetch(`${wikiApiUrl}?${pageParams.toString()}`);
    
    if (!pageResponse.ok) {
      return NextResponse.json(
        { error: `Wikipedia page API error: ${pageResponse.status}` },
        { status: pageResponse.status }
      );
    }
    
    const pageData = await pageResponse.json();
    
    if (!pageData.query || !pageData.query.pages) {
      return NextResponse.json(
        { error: 'Failed to retrieve page data' },
        { status: 404 }
      );
    }
    
    // Get the page (the API returns an object with page IDs as keys)
    const pageId = Object.keys(pageData.query.pages)[0];
    const page = pageData.query.pages[pageId];
    
    if (pageId === '-1' || !page) {
      return NextResponse.json(
        { error: 'Wikipedia page not found' },
        { status: 404 }
      );
    }
    
    // Check if the page has a thumbnail
    if (!page.thumbnail || !page.thumbnail.source) {
      return NextResponse.json(
        { error: 'No cover image found on Wikipedia page' },
        { status: 404 }
      );
    }
    
    // Return the cover URL and page info
    return NextResponse.json({
      coverUrl: page.thumbnail.source,
      title: page.title,
      source: 'wikipedia',
      pageUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      extract: page.extract ? page.extract.substring(0, 300) + '...' : undefined,
      cached: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=604800',
      }
    });
    
  } catch (error) {
    console.error('Wikipedia cover API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch game cover from Wikipedia' },
      { status: 500 }
    );
  }
} 