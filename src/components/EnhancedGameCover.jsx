'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

// Simple in-memory cache for cover URLs to reduce API calls during the session
const coverCache = new Map();

export default function EnhancedGameCover({ 
  game, 
  width = 300, 
  height = 200, 
  className = '',
  source = 'wikimedia' // Default to wikimedia. Options: 'wikimedia', 'screenscraper', 'tgdb', or 'auto'
}) {
  const [coverUrl, setCoverUrl] = useState(() => {
    // Initialize with cached URL if available to avoid flicker
    try {
      // Check memory cache first (fastest)
      const cacheKey = game?.image || `${source}:${game?.title}:${game?.core}`;
      if (coverCache.has(cacheKey)) {
        return coverCache.get(cacheKey);
      }
      
      // Then check localStorage
      if (typeof window !== 'undefined' && game) {
        const cachedData = localStorage.getItem(`cover_${cacheKey}`);
        if (cachedData) {
          const { url } = JSON.parse(cachedData);
          // Update memory cache
          coverCache.set(cacheKey, url);
          return url;
        }
      }
      
      // For external URLs, use directly
      if (game?.image && (game.image.startsWith('http://') || game.image.startsWith('https://'))) {
        return game.image;
      }
      
      // For local images
      if (game?.image && !game.image.startsWith('wikimedia:') && 
          !game.image.startsWith('tgdb:') && !game.image.startsWith('screenscraper:') &&
          !game.image.includes('default-image')) {
        return `/game/${game.image}`;
      }
      
      // Default - will trigger fetch
      return null;
    } catch (err) {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(!coverUrl);
  const [error, setError] = useState(null);
  const [cacheDate, setCacheDate] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const defaultImage = '/game/default-image.png';

  useEffect(() => {
    // Skip fetch if we already have an image from initialization
    if (coverUrl) {
      setIsFromCache(true);
      setLoading(false);
      return;
    }
    
    const cacheKey = game?.image || `${source}:${game?.title}:${game?.core}`;
    
    // Function to check localStorage cache - permanent storage
    const checkLocalCache = (key) => {
      try {
        if (typeof window !== 'undefined') {
          const cachedData = localStorage.getItem(`cover_${key}`);
          if (cachedData) {
            const { url, timestamp } = JSON.parse(cachedData);
            setCacheDate(new Date(timestamp).toLocaleDateString());
            setIsFromCache(true);
            return url;
          }
        }
        return null;
      } catch (err) {
        return null;
      }
    };

    // Function to save to localStorage cache
    const saveToLocalCache = (key, url) => {
      try {
        if (typeof window !== 'undefined') {
          const data = {
            url,
            timestamp: Date.now()
          };
          localStorage.setItem(`cover_${key}`, JSON.stringify(data));
          coverCache.set(key, url);
        }
      } catch (err) {
        // Silently fail
      }
    };

    // Skip if no game data
    if (!game || !game.title) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const attemptImageFetch = async () => {
      // First try existing image reference formats
      if (game.image) {
        // Check if this is a full URL (external image)
        if (game.image.startsWith('http://') || game.image.startsWith('https://')) {
          setCoverUrl(game.image);
          setLoading(false);
          return;
        }

        if (game.image.startsWith('tgdb:')) {
          const cachedUrl = checkLocalCache(game.image);
          if (cachedUrl) {
            setCoverUrl(cachedUrl);
          } else {
            fetchTGDBImage(game.image);
          }
          return;
        } else if (game.image.startsWith('screenscraper:')) {
          const cachedUrl = checkLocalCache(game.image);
          if (cachedUrl) {
            setCoverUrl(cachedUrl);
          } else {
            fetchScreenscraperImage(game.image);
          }
          return;
        } else if (game.image.startsWith('wikimedia:')) {
          const cachedUrl = checkLocalCache(game.image);
          if (cachedUrl) {
            setCoverUrl(cachedUrl);
          } else {
            // Extract title from reference
            const parts = game.image.split(':');
            if (parts.length >= 2) {
              const title = decodeURIComponent(parts[1]);
              // Use game-images API to fetch from Wikimedia
              try {
                const response = await fetch(`/api/game-images?name=${encodeURIComponent(title)}${game.core ? `&console=${encodeURIComponent(game.core)}` : ''}`);
                const data = await response.json();
                if (data.success && data.imageUrl) {
                  setCoverUrl(data.imageUrl);
                  saveToLocalCache(game.image, data.imageUrl);
                }
              } catch (err) {
                setError('Wikimedia image not available');
              } finally {
                setLoading(false);
              }
            }
          }
          return;
        } else if (!game.image.includes('default-image')) {
          // Regular local image
          setCoverUrl(`/game/${game.image}`);
          setLoading(false);
          return;
        }
      }
      
      // If no valid image, try to fetch automatically using title and core
      if (game.title && game.core) {
        // Generate a cache key
        const cacheKey = `${source}:${game.title}:${game.core}`;
        
        const cachedUrl = checkLocalCache(cacheKey);
        if (cachedUrl) {
          setCoverUrl(cachedUrl);
          setLoading(false);
        } else {
          fetchGameCover(source);
        }
        return;
      }
      
      // No way to get an image
      setLoading(false);
    };

    // Start the fetch process
    attemptImageFetch();
    
  }, [game, source, coverUrl]);

  // Extract image from HTML - Same implementation as in GameImage and Wiki Image Extraction Test
  const extractImageFromHtml = (html) => {
    if (!html) return null;
    
    console.log(`[EnhancedGameCover] Extracting image from HTML (${html.length} chars)`);
    
    // Try to find the infobox - Same patterns as in Wiki Image Extraction Test
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
        console.log(`[EnhancedGameCover] Found infobox HTML (${infoboxHtml.length} chars)`);
        break;
      }
    }
    
    if (!infoboxHtml) {
      console.log(`[EnhancedGameCover] No infobox found in the page`);
      return null;
    }
    
    // Try to find the image in the second row - Same as in Wiki Image Extraction Test
    const rows = infoboxHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (rows && rows.length >= 2) {
      const imageMatch = rows[1].match(/<img[^>]*src="([^"]*)"[^>]*>/i);
      if (imageMatch && imageMatch[1]) {
        let imageUrl = imageMatch[1];
        if (imageUrl.startsWith('//')) {
          imageUrl = `https:${imageUrl}`;
        }
        console.log(`[EnhancedGameCover] Found image in second row: ${imageUrl}`);
        return imageUrl;
      }
    }
    
    // If no image in second row, try to find any image in the infobox - Same as in Wiki Image Extraction Test
    const imageMatch = infoboxHtml.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
    if (imageMatch && imageMatch[1]) {
      let imageUrl = imageMatch[1];
      if (imageUrl.startsWith('//')) {
        imageUrl = `https:${imageUrl}`;
      }
      console.log(`[EnhancedGameCover] Found image in infobox: ${imageUrl}`);
      return imageUrl;
    }
    
    console.log(`[EnhancedGameCover] No image found in infobox`);
    return null;
  };

  // Function to fetch game cover from selected source
  const fetchGameCover = async (preferredSource) => {
    if (!game.title || !game.core) {
      setError('Missing game title or core');
      return;
    }

    console.log(`[EnhancedGameCover] Fetching game cover for ${game.title} using source: ${preferredSource}`);

    // Generate a cache key
    const cacheKey = `${preferredSource}:${game.title}:${game.core}`;
    
    // Check in-memory cache first
    if (coverCache.has(cacheKey)) {
      setCoverUrl(coverCache.get(cacheKey));
      return;
    }

    setLoading(true);
    
    // For wikimedia, use direct extraction like in GameImage
    if (preferredSource === 'wikimedia') {
      try {
        console.log(`[EnhancedGameCover] Using Wiki Image Extraction method for: ${game.title}`);
        
        // Step 1: First, search for the page to get the exact title - Same as in Wiki Image Extraction Test
        console.log(`[EnhancedGameCover] Step 1 - Searching for: ${game.title}`);
        const searchQuery = `${game.title} video game`;
        
        const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`);
        
        if (!searchResponse.ok) {
          throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
        }
        
        const searchData = await searchResponse.json();
        console.log(`[EnhancedGameCover] Search results:`, searchData.query ? `Found ${searchData.query.search?.length || 0} results` : 'No results');
        
        if (!searchData.query?.search || searchData.query.search.length === 0) {
          throw new Error('No search results found');
        }
        
        // Get the exact title from the first search result
        const exactTitle = searchData.query.search[0].title;
        console.log(`[EnhancedGameCover] Found exact title: "${exactTitle}"`);
        
        // Step 2: Now fetch the raw HTML content to extract images - Same as in Wiki Image Extraction Test
        console.log(`[EnhancedGameCover] Step 2 - Fetching HTML content for: ${exactTitle}`);
        const contentResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(exactTitle)}&prop=text&format=json&origin=*`);
        
        if (!contentResponse.ok) {
          throw new Error(`Failed to fetch page content: ${contentResponse.status}`);
        }
        
        const contentData = await contentResponse.json();
        if (!contentData.parse?.text?.['*']) {
          throw new Error('No HTML content found');
        }
        
        const htmlContent = contentData.parse.text['*'];
        console.log(`[EnhancedGameCover] Received HTML content (${htmlContent.length} chars)`);
        
        // Now extract the image from the HTML - Same as in Wiki Image Extraction Test
        let extractedImageUrl = extractImageFromHtml(htmlContent);
        
        if (extractedImageUrl) {
          console.log(`[EnhancedGameCover] Successfully extracted image: ${extractedImageUrl}`);
          
          // Store the result
          setCoverUrl(extractedImageUrl);
          coverCache.set(cacheKey, extractedImageUrl);
          
          // Cache in localStorage permanently
          try {
            if (typeof window !== 'undefined') {
              const cacheData = {
                url: extractedImageUrl,
                title: exactTitle,
                source: 'wikimedia',
                timestamp: Date.now()
              };
              localStorage.setItem(`cover_${cacheKey}`, JSON.stringify(cacheData));
              setCacheDate(new Date().toLocaleDateString());
            }
          } catch (err) {
            console.error("[EnhancedGameCover] Error saving to localStorage:", err);
          }
          
          setLoading(false);
          return;
        }
        
        // Step 3: If no image found in HTML, try the thumbnail API - Same as in Wiki Image Extraction Test
        console.log(`[EnhancedGameCover] Step 3 - No image in HTML, trying thumbnail API for: ${exactTitle}`);
        const thumbnailResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(exactTitle)}&prop=pageimages&format=json&pithumbsize=500&origin=*`);
        
        if (thumbnailResponse.ok) {
          const thumbnailData = await thumbnailResponse.json();
          const pages = thumbnailData.query?.pages;
          
          if (pages) {
            const pageId = Object.keys(pages)[0];
            const thumbnail = pages[pageId]?.thumbnail?.source;
            
            if (thumbnail) {
              console.log(`[EnhancedGameCover] Found thumbnail: ${thumbnail}`);
              
              // Store the result
              setCoverUrl(thumbnail);
              coverCache.set(cacheKey, thumbnail);
              
              // Cache in localStorage permanently
              try {
                if (typeof window !== 'undefined') {
                  const cacheData = {
                    url: thumbnail,
                    title: exactTitle,
                    source: 'wikimedia',
                    timestamp: Date.now()
                  };
                  localStorage.setItem(`cover_${cacheKey}`, JSON.stringify(cacheData));
                  setCacheDate(new Date().toLocaleDateString());
                }
              } catch (err) {
                console.error("[EnhancedGameCover] Error saving to localStorage:", err);
              }
              
              setLoading(false);
              return;
            }
          }
        }
        
        throw new Error('No image found for this game');
        
      } catch (err) {
        console.error('[EnhancedGameCover] Error fetching Wikimedia image:', err);
        setError('Wikimedia cover unavailable');
        setLoading(false);
        return;
      }
    }
    
    // For TGDB and ScreenScraper, use direct API calls instead of the deprecated API route
    else if (preferredSource === 'tgdb') {
      try {
        console.log(`[EnhancedGameCover] Fetching TGDB image for: ${game.title}`);
        // Log the request
        console.log(`[EnhancedGameCover] TGDB direct API not implemented yet, falling back to wikimedia`);
        
        // For now, fall back to wikimedia since we don't have direct TGDB API access
        // You can implement the direct TGDB API call here in the future
        
        // Fall back to wikimedia
        fetchGameCover('wikimedia');
      } catch (err) {
        console.error('[EnhancedGameCover] Error fetching TGDB image:', err);
        setError('TGDB cover unavailable');
        setLoading(false);
      }
    } else if (preferredSource === 'screenscraper') {
      try {
        console.log(`[EnhancedGameCover] Fetching ScreenScraper image for: ${game.title}`);
        // Log the request
        console.log(`[EnhancedGameCover] ScreenScraper direct API not implemented yet, falling back to wikimedia`);
        
        // For now, fall back to wikimedia since we don't have direct ScreenScraper API access
        // You can implement the direct ScreenScraper API call here in the future
        
        // Fall back to wikimedia
        fetchGameCover('wikimedia');
      } catch (err) {
        console.error('[EnhancedGameCover] Error fetching ScreenScraper image:', err);
        setError('ScreenScraper cover unavailable');
        setLoading(false);
      }
    } else {
      setError(`Unknown source: ${preferredSource}`);
      setLoading(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {/* Use standard img tag for external URLs, Next.js Image for local paths */}
      {coverUrl && (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) ? (
        <img
          src={coverUrl}
          alt={game?.title || 'Game Cover'}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={() => setCoverUrl('/game/default-image.png')}
          loading="eager"
          priority="true"
        />
      ) : (
        <Image
          src={coverUrl || defaultImage}
          width={width}
          height={height}
          alt={game?.title || 'Game Cover'}
          quality={80}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={() => setCoverUrl(defaultImage)}
          loading="eager"
          priority={true}
        />
      )}
      
      {error && !coverUrl && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-accent text-xs p-1 text-center">
          {error}
        </div>
      )}
      
      {isFromCache && coverUrl && (
        <div className="absolute top-0 right-0 bg-green-500/80 text-white text-xs px-1 py-0.5 rounded-bl">
          Cached
        </div>
      )}
    </div>
  );
}

// Update the fetchGameCover function to include Wikipedia option
export async function fetchGameCover(gameTitle, core, preferredSource = 'auto') {
  // Skip fetch if parameters are missing
  if (!gameTitle || !core) return null;

  try {
    // Generate a cache key based on game title, core, and preferred source
    const cacheKey = `game_cover_${preferredSource}_${gameTitle.toLowerCase()}_${core}`;
    
    // Check in-memory cache first
    if (coverCache[cacheKey]) {
      return coverCache[cacheKey];
    }
    
    // Check localStorage cache next (if available)
    if (typeof localStorage !== 'undefined') {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          // Check if cache is expired (7 days)
          const now = new Date();
          const cacheTime = new Date(parsedData.timestamp);
          const cacheAge = now - cacheTime;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          
          if (cacheAge < maxAge) {
            // Add to memory cache
            coverCache[cacheKey] = parsedData;
            return parsedData;
          }
        } catch (e) {
          console.error('Error parsing cached cover:', e);
          // Invalid cache, continue to fetch
        }
      }
    }
    
    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    // Use source parameter to specify the API source
    const queryParams = new URLSearchParams({
      name: gameTitle,
      core: core,
      source: preferredSource
    });
    
    try {
      const response = await fetch(`/api/game-covers?${queryParams.toString()}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle API errors
        if (response.status === 404) {
          throw new Error('No cover found for this game');
        } else if (response.status === 503) {
          throw new Error('Game cover API is temporarily unavailable');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      if (data && data.coverUrl) {
        // Create result object
        const result = {
          coverUrl: data.coverUrl,
          title: data.gameTitle || gameTitle,
          source: data.source || preferredSource,
          timestamp: new Date().toISOString()
        };
        
        // Check for Wikipedia page URL if available
        if (data.pageUrl) {
          result.pageUrl = data.pageUrl;
        }
        
        // Add to in-memory cache
        coverCache[cacheKey] = result;
        
        // Save to localStorage if available
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {
            console.warn('Failed to cache game cover:', e);
          }
        }
        
        return result;
      } else {
        throw new Error('No cover URL returned from API');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Game cover request timed out');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error fetching game cover:', error);
    
    // If the preferred source is not 'auto' and fails, try 'auto' as fallback
    if (preferredSource !== 'auto') {
      console.warn(`Trying 'auto' source as fallback for ${gameTitle}`);
      try {
        return await fetchGameCover(gameTitle, core, 'auto');
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}

// Update the SourceSelect component to include Wikipedia
function SourceSelect({ value, onChange, disabled }) {
  return (
    <div className="form-select border border-gray-300 rounded p-2 dark:bg-gray-800 dark:border-gray-600">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-transparent w-full outline-none"
      >
        <option value="auto">Auto (Try All Sources)</option>
        <option value="screenscraper">ScreenScraper</option>
        <option value="tgdb">TheGamesDB</option>
        <option value="wikipedia">Wikipedia</option>
      </select>
    </div>
  );
} 