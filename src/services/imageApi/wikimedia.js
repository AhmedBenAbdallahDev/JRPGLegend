/**
 * Wikimedia API Service
 * 
 * Handles all interactions with the Wikimedia API for fetching game cover images.
 */
import ImageCache from '../imageCache';

/**
 * Extract image URL from Wikipedia HTML content
 * 
 * @param {string} html - HTML content from Wikipedia
 * @returns {string|null} - Extracted image URL or null
 */
export function extractImageFromHtml(html) {
  if (!html) return null;
  
  // Try to find the infobox
  const infoboxPatterns = [
    /<table class="[^"]*infobox[^"]*vg[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
    /<table class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
    /<table class="[^"]*infobox[^"]*vevent[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
    /<table class="[^"]*infobox[^"]*game[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
    /<table class="[^"]*infobox[^"]*software[^"]*"[^>]*>([\s\S]*?)<\/table>/i
  ];
  
  let infoboxHtml = null;
  for (const pattern of infoboxPatterns) {
    const infoboxMatch = html.match(pattern);
    if (infoboxMatch && infoboxMatch[0]) {
      infoboxHtml = infoboxMatch[0];
      break;
    }
  }
  
  if (!infoboxHtml) return null;
  
  // Try to find the image in the second row
  const rows = infoboxHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
  if (rows && rows.length >= 2) {
    const imageMatch = rows[1].match(/<img[^>]*src="([^"]*)"[^>]*>/i);
    if (imageMatch && imageMatch[1]) {
      let imageUrl = imageMatch[1];
      if (imageUrl.startsWith('//')) {
        imageUrl = `https:${imageUrl}`;
      }
      return imageUrl;
    }
  }
  
  // If no image in second row, try to find any image in the infobox
  const imageMatch = infoboxHtml.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
  if (imageMatch && imageMatch[1]) {
    let imageUrl = imageMatch[1];
    if (imageUrl.startsWith('//')) {
      imageUrl = `https:${imageUrl}`;
    }
    return imageUrl;
  }
  
  return null;
}

/**
 * Fetch a game cover image from Wikimedia
 * 
 * @param {Object|string} gameOrTitle - Either a game object or game title
 * @param {string} [core] - Game system/core (required if gameOrTitle is string)
 * @returns {Promise<{url: string, source: string, fromCache: boolean}>} - Image result
 */
export async function fetchCover(gameOrTitle, core) {
  // Handle different parameter types
  let gameTitle, gameCore;
  
  if (typeof gameOrTitle === 'object') {
    // It's a game object
    const game = gameOrTitle;
    
    // Special case for wikimedia: reference
    if (game.image && game.image.startsWith('wikimedia:')) {
      const parts = game.image.split(':');
      if (parts.length >= 2) {
        gameTitle = decodeURIComponent(parts[1]);
        gameCore = game.core;
      } else {
        gameTitle = game.title;
        gameCore = game.core;
      }
    } else {
      gameTitle = game.title;
      gameCore = game.core;
    }
  } else {
    // It's a string (title)
    gameTitle = gameOrTitle;
    gameCore = core;
  }
  
  if (!gameTitle || !gameCore) {
    throw new Error('Missing game title or core');
  }

  console.log(`[WikimediaAPI] Fetching cover for ${gameTitle} (${gameCore})`);

  // Generate cache key
  const cacheKey = `wikimedia:${gameTitle}:${gameCore}`;
  
  // Check cache first
  const cachedUrl = ImageCache.checkCache(cacheKey);
  if (cachedUrl) {
    console.log(`[WikimediaAPI] Using cached image for ${gameTitle}`);
    return {
      url: cachedUrl,
      source: 'wikimedia',
      fromCache: true
    };
  }

  try {
    console.log(`[WikimediaAPI] Using Wiki Image Extraction method for: ${gameTitle}`);
    
    // Step 1: First, search for the page to get the exact title
    console.log(`[WikimediaAPI] Step 1 - Searching for: ${gameTitle}`);
    
    // Construct a search query with title and core
    const searchQuery = `${gameTitle} ${gameCore}`;
    console.log(`[WikimediaAPI] Search Query: "${searchQuery}"`);
    
    // Limit results to 3 for faster loading
    const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*&srlimit=3`);
    
    if (!searchResponse.ok) {
      throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    console.log(`[WikimediaAPI] Search results:`, searchData.query ? `Found ${searchData.query.search?.length || 0} results` : 'No results');
    
    if (!searchData.query?.search || searchData.query.search.length === 0) {
      throw new Error('No search results found');
    }
    
    // Filter out unwanted results
    const filteredResults = searchData.query.search.filter(result => {
      const title = result.title.toLowerCase();
      
      // Reject results that start with "List of"
      if (title.startsWith("list of")) return false;
      
      // Reject results that are just console names
      if (title === gameCore.toLowerCase()) return false;
      if (title === "game boy advance" || title === "gba") return false;
      if (title === "nintendo entertainment system" || title === "nes") return false;
      if (title === "super nintendo entertainment system" || title === "snes") return false;
      if (title === "nintendo 64" || title === "n64") return false;
      if (title === "game boy" || title === "gb") return false;
      if (title === "game boy color" || title === "gbc") return false;
      if (title === "playstation" || title === "psx") return false;
      if (title === "playstation portable" || title === "psp") return false;
      if (title === "sega genesis" || title === "genesis") return false;
      if (title === "sega cd" || title === "segacd") return false;
      if (title === "sega saturn" || title === "saturn") return false;
      if (title === "nintendo ds" || title === "nds") return false;
      
      return true;
    });
    
    if (filteredResults.length === 0) {
      throw new Error('No relevant search results found');
    }
    
    // Get the exact title from the first filtered search result
    const exactTitle = filteredResults[0].title;
    console.log(`[WikimediaAPI] Found exact title: "${exactTitle}"`);
    
    // Step 2: Now fetch the HTML content to extract images
    console.log(`[WikimediaAPI] Step 2 - Fetching HTML content for: ${exactTitle}`);
    const contentResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(exactTitle)}&prop=text&format=json&origin=*`);
    
    if (!contentResponse.ok) {
      throw new Error(`Failed to fetch page content: ${contentResponse.status}`);
    }
    
    const contentData = await contentResponse.json();
    if (!contentData.parse?.text?.['*']) {
      throw new Error('No HTML content found');
    }
    
    const htmlContent = contentData.parse.text['*'];
    console.log(`[WikimediaAPI] Received HTML content (${htmlContent.length} chars)`);
    
    // Extract the image from the HTML
    let extractedImageUrl = extractImageFromHtml(htmlContent);
    
    if (extractedImageUrl) {
      console.log(`[WikimediaAPI] Successfully extracted image: ${extractedImageUrl}`);
      
      // Cache the result
      ImageCache.saveToLocalStorageCache(
        cacheKey, 
        extractedImageUrl, 
        { title: exactTitle, source: 'wikimedia' }
      );
      
      return {
        url: extractedImageUrl,
        source: 'wikimedia',
        fromCache: false
      };
    }
    
    // Step 3: If no image found in HTML, try the thumbnail API
    console.log(`[WikimediaAPI] Step 3 - No image in HTML, trying thumbnail API for: ${exactTitle}`);
    const thumbnailResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(exactTitle)}&prop=pageimages&format=json&pithumbsize=500&origin=*`);
    
    if (thumbnailResponse.ok) {
      const thumbnailData = await thumbnailResponse.json();
      const pages = thumbnailData.query?.pages;
      
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const thumbnail = pages[pageId]?.thumbnail?.source;
        
        if (thumbnail) {
          console.log(`[WikimediaAPI] Found thumbnail: ${thumbnail}`);
          
          // Cache the result
          ImageCache.saveToLocalStorageCache(
            cacheKey, 
            thumbnail, 
            { title: exactTitle, source: 'wikimedia' }
          );
          
          return {
            url: thumbnail,
            source: 'wikimedia',
            fromCache: false
          };
        }
      }
    }
    
    throw new Error('No image found for this game');
    
  } catch (err) {
    console.error('[WikimediaAPI] Error fetching image:', err.message);
    throw err;
  }
}

/**
 * Handle special wikimedia: reference
 * 
 * @param {string} reference - The 'wikimedia:' reference
 * @param {Object} game - Game object to use for additional context
 * @returns {Promise<{url: string, source: string, fromCache: boolean}>} - Image result
 */
export async function handleReference(reference, game) {
  try {
    const parts = reference.split(':');
    if (parts.length >= 2) {
      const title = decodeURIComponent(parts[1]);
      
      console.log(`[WikimediaAPI] Handling wikimedia reference for ${title}`);
      
      // Use the reference as cache key first
      const cachedUrl = ImageCache.checkCache(reference);
      if (cachedUrl) {
        console.log(`[WikimediaAPI] Found cached URL for reference: ${reference}`);
        return {
          url: cachedUrl,
          source: 'wikimedia',
          fromCache: true
        };
      }
      
      // If not in cache, use game-images API to fetch from Wikimedia
      console.log(`[WikimediaAPI] Trying game-images API for ${title}`);
      
      const response = await fetch(`/api/game-images?name=${encodeURIComponent(title)}${game.core ? `&console=${encodeURIComponent(game.core)}` : ''}`);
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        console.log(`[WikimediaAPI] Success from game-images API: ${data.imageUrl}`);
        
        // Cache the result
        ImageCache.saveToLocalStorageCache(
          reference, 
          data.imageUrl, 
          { title, source: 'wikimedia' }
        );
        
        return {
          url: data.imageUrl,
          source: 'wikimedia',
          fromCache: false
        };
      }
      
      throw new Error('No image found from game-images API');
    } else {
      throw new Error('Invalid wikimedia reference format');
    }
  } catch (err) {
    console.error('[WikimediaAPI] Error handling reference:', err.message);
    throw err;
  }
}

export default {
  fetchCover,
  handleReference,
  extractImageFromHtml
}; 