/**
 * Vercel API route for fetching game cover images from Wikipedia
 * This is useful for external calls to the API from other sites or services
 */

// Initialize CORS settings
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
function handleOptions(req, res) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  return res.status(204).end();
}

// Main handler function
export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }
  
  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { game } = req.query;
    
    if (!game) {
      return res.status(400).json({ error: 'Missing game parameter' });
    }
    
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
      return res.status(searchResponse.status).json({ 
        error: `Wikipedia search API error: ${searchResponse.status}` 
      });
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
      return res.status(404).json({ error: 'No Wikipedia page found for this game' });
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
      return res.status(pageResponse.status).json({ 
        error: `Wikipedia page API error: ${pageResponse.status}` 
      });
    }
    
    const pageData = await pageResponse.json();
    
    if (!pageData.query || !pageData.query.pages) {
      return res.status(404).json({ error: 'Failed to retrieve page data' });
    }
    
    // Get the page (the API returns an object with page IDs as keys)
    const pageId = Object.keys(pageData.query.pages)[0];
    const page = pageData.query.pages[pageId];
    
    if (pageId === '-1' || !page) {
      return res.status(404).json({ error: 'Wikipedia page not found' });
    }
    
    // Check if the page has a thumbnail
    if (!page.thumbnail || !page.thumbnail.source) {
      return res.status(404).json({ error: 'No cover image found on Wikipedia page' });
    }
    
    // Add cache headers (7 days)
    res.setHeader('Cache-Control', 'public, max-age=604800');
    
    // Return the cover URL and page info
    return res.status(200).json({
      coverUrl: page.thumbnail.source,
      title: page.title,
      source: 'wikipedia',
      pageUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      extract: page.extract ? page.extract.substring(0, 300) + '...' : undefined,
      cached: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    
  } catch (error) {
    console.error('Wikipedia cover API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch game cover from Wikipedia' 
    });
  }
} 