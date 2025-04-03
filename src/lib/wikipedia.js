/**
 * Wikipedia API utilities for fetching game metadata and images
 * 
 * This file provides functions to interact with the Wikipedia/Wikimedia API
 * to retrieve game information and cover images.
 */

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';
const WIKIMEDIA_API_URL = 'https://commons.wikimedia.org/w/api.php';

/**
 * Helper function to detect if running in a server environment
 */
const isServer = typeof window === 'undefined';

/**
 * Helper logging function
 */
function logWiki(context, message, data = null, isError = false) {
  if (isServer) {
    const timestamp = new Date().toISOString();
    const logMethod = isError ? console.error : console.log;
    const prefix = `[WIKI:${context}] ${timestamp}`;
    
    if (data) {
      logMethod(`${prefix} ${message}`, data);
    } else {
      logMethod(`${prefix} ${message}`);
    }
  }
}

/**
 * Fetch with timeout helper for Wikipedia API
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    logWiki('Fetch', `Response: ${response.status} (${duration}ms)`);
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      logWiki('Fetch', `Timeout after ${duration}ms`, null, true);
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    logWiki('Fetch', `Error: ${error.message} (${duration}ms)`, error, true);
    throw error;
  }
}

/**
 * Search for a game on Wikipedia
 * 
 * @param {string} gameName - The name of the game to search for
 * @returns {Promise<Object>} - Wikipedia search results
 */
export async function searchWikipedia(gameName) {
  try {
    if (!gameName) {
      logWiki('Search', 'Missing game name', null, true);
      throw new Error('Game name is required');
    }
    
    // Add "video game" to the search query to improve relevance
    const searchTerm = `${gameName} video game`;
    
    // Create URL with proper parameters for Wikipedia search
    const url = new URL(WIKIPEDIA_API_URL);
    url.searchParams.append('action', 'query');
    url.searchParams.append('list', 'search');
    url.searchParams.append('srsearch', searchTerm);
    url.searchParams.append('format', 'json');
    url.searchParams.append('origin', '*'); // Enable CORS
    url.searchParams.append('srlimit', '5'); // Limit to 5 results
    
    logWiki('Search', `Searching for: "${searchTerm}"`);
    
    const response = await fetchWithTimeout(url.toString());
    
    if (!response.ok) {
      logWiki('Search', `Wikipedia API error: ${response.status}`, null, true);
      throw new Error(`Wikipedia search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.query || !data.query.search) {
      logWiki('Search', 'No search results found', null, true);
      return { results: [] };
    }
    
    const results = data.query.search.map(item => ({
      title: item.title,
      pageid: item.pageid,
      snippet: item.snippet.replace(/<\/?span[^>]*>/g, '') // Remove HTML tags from snippet
    }));
    
    logWiki('Search', `Found ${results.length} results for "${searchTerm}"`);
    
    return { results };
  } catch (error) {
    logWiki('Search', `Error searching Wikipedia for "${gameName}"`, error, true);
    throw error;
  }
}

/**
 * Get Wikipedia page details including images
 * 
 * @param {string} pageTitle - The Wikipedia page title
 * @returns {Promise<Object>} - Page details with images
 */
export async function getWikipediaPage(pageTitle) {
  try {
    if (!pageTitle) {
      logWiki('GetPage', 'Missing page title', null, true);
      throw new Error('Page title is required');
    }
    
    // Create URL for Wikipedia page details with images
    const url = new URL(WIKIPEDIA_API_URL);
    url.searchParams.append('action', 'query');
    url.searchParams.append('titles', pageTitle);
    url.searchParams.append('prop', 'pageimages|images|info|extracts'); // Get images, basic info and extract
    url.searchParams.append('pithumbsize', '1000'); // Request large thumbnail
    url.searchParams.append('format', 'json');
    url.searchParams.append('exintro', '1'); // Only return the intro section
    url.searchParams.append('explaintext', '1'); // Return plain text extract
    url.searchParams.append('inprop', 'url'); // Get page URL
    url.searchParams.append('origin', '*'); // Enable CORS
    
    logWiki('GetPage', `Fetching details for: "${pageTitle}"`);
    
    const response = await fetchWithTimeout(url.toString());
    
    if (!response.ok) {
      logWiki('GetPage', `Wikipedia API error: ${response.status}`, null, true);
      throw new Error(`Wikipedia page API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.query || !data.query.pages) {
      logWiki('GetPage', 'Invalid response format', null, true);
      return { page: null };
    }
    
    // Wikipedia returns pages as an object with page IDs as keys
    const pageId = Object.keys(data.query.pages)[0];
    const page = data.query.pages[pageId];
    
    // Check if the page exists
    if (pageId === '-1' || !page) {
      logWiki('GetPage', `Page "${pageTitle}" not found`, null, true);
      return { page: null };
    }
    
    // Extract the main details
    const result = {
      title: page.title,
      pageid: page.pageid,
      url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      extract: page.extract || '',
      thumbnail: page.thumbnail ? page.thumbnail.source : null,
      images: page.images ? page.images.map(img => img.title) : []
    };
    
    logWiki('GetPage', `Successfully fetched page: "${pageTitle}"`);
    
    return { page: result };
  } catch (error) {
    logWiki('GetPage', `Error fetching Wikipedia page "${pageTitle}"`, error, true);
    throw error;
  }
}

/**
 * Get all available images from a Wikipedia page that might be suitable as covers
 * 
 * @param {string} pageTitle - The Wikipedia page title
 * @returns {Promise<Object>} - List of potential cover images
 */
export async function getWikipediaImages(pageTitle) {
  try {
    if (!pageTitle) {
      logWiki('GetImages', 'Missing page title', null, true);
      throw new Error('Page title is required');
    }
    
    // First get the page details
    const { page } = await getWikipediaPage(pageTitle);
    
    if (!page) {
      return { images: [] };
    }
    
    // If the page has a thumbnail, prioritize it as the likely cover image
    const images = [];
    
    if (page.thumbnail) {
      images.push({
        title: 'Main Thumbnail',
        url: page.thumbnail,
        isPrimary: true
      });
    }
    
    // If we have a list of images, fetch details for each one
    if (page.images && page.images.length > 0) {
      // Get details for up to 5 images that might be cover art
      const potentialCoverImages = page.images
        .filter(img => {
          const lowerTitle = img.toLowerCase();
          // Look for image titles that likely contain cover art
          return (
            lowerTitle.includes('cover') || 
            lowerTitle.includes('box') || 
            lowerTitle.includes('artwork') || 
            lowerTitle.includes('logo') ||
            // Filter out SVGs and PNGs as they're often logos or icons
            (lowerTitle.endsWith('.jpg') || lowerTitle.endsWith('.jpeg'))
          );
        })
        .slice(0, 5);
      
      if (potentialCoverImages.length > 0) {
        // Get image URLs
        const imageInfoUrl = new URL(WIKIPEDIA_API_URL);
        imageInfoUrl.searchParams.append('action', 'query');
        imageInfoUrl.searchParams.append('titles', potentialCoverImages.join('|'));
        imageInfoUrl.searchParams.append('prop', 'imageinfo');
        imageInfoUrl.searchParams.append('iiprop', 'url|size');
        imageInfoUrl.searchParams.append('format', 'json');
        imageInfoUrl.searchParams.append('origin', '*');
        
        const imageResponse = await fetchWithTimeout(imageInfoUrl.toString());
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          
          if (imageData.query && imageData.query.pages) {
            // Process each image
            Object.values(imageData.query.pages).forEach(imgPage => {
              if (imgPage.imageinfo && imgPage.imageinfo.length > 0) {
                const imgInfo = imgPage.imageinfo[0];
                images.push({
                  title: imgPage.title,
                  url: imgInfo.url,
                  width: imgInfo.width,
                  height: imgInfo.height,
                  isPrimary: false
                });
              }
            });
          }
        }
      }
    }
    
    logWiki('GetImages', `Found ${images.length} potential cover images for "${pageTitle}"`);
    
    return { images, page };
  } catch (error) {
    logWiki('GetImages', `Error fetching images for "${pageTitle}"`, error, true);
    throw error;
  }
}

/**
 * Find a Wikipedia game cover image by game name
 * 
 * @param {string} gameName - The name of the game to search for
 * @returns {Promise<{coverUrl: string, title: string, source: string}>} - Game cover URL and metadata
 */
export async function getGameCoverFromWikipedia(gameName) {
  try {
    if (!gameName) {
      logWiki('GetCover', 'Missing game name', null, true);
      throw new Error('Game name is required');
    }
    
    logWiki('GetCover', `Searching for cover of: "${gameName}"`);
    
    // Step 1: Search Wikipedia for the game
    const searchResults = await searchWikipedia(gameName);
    
    if (!searchResults.results || searchResults.results.length === 0) {
      logWiki('GetCover', `No Wikipedia pages found for: "${gameName}"`, null, true);
      return null;
    }
    
    // Take the first search result as most relevant
    const firstResult = searchResults.results[0];
    logWiki('GetCover', `Using Wikipedia page: "${firstResult.title}"`);
    
    // Step 2: Get images from that page
    const { images, page } = await getWikipediaImages(firstResult.title);
    
    if (!images || images.length === 0) {
      logWiki('GetCover', `No images found on Wikipedia page: "${firstResult.title}"`, null, true);
      return null;
    }
    
    // First try to find the primary image (thumbnail)
    const primaryImage = images.find(img => img.isPrimary);
    
    // If we have a primary image, use it
    if (primaryImage) {
      logWiki('GetCover', `Found primary image for "${gameName}": ${primaryImage.url}`);
      return {
        coverUrl: primaryImage.url,
        title: page.title,
        source: 'wikipedia',
        pageUrl: page.url
      };
    }
    
    // Otherwise use the first image
    logWiki('GetCover', `Using first available image for "${gameName}": ${images[0].url}`);
    return {
      coverUrl: images[0].url,
      title: page.title,
      source: 'wikipedia',
      pageUrl: page.url
    };
  } catch (error) {
    logWiki('GetCover', `Error finding Wikipedia cover for "${gameName}"`, error, true);
    throw error;
  }
} 