'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { HiPhotograph } from 'react-icons/hi';

// Simple in-memory cache for cover URLs to reduce API calls during the session
const coverCache = new Map();

// Default image if nothing else is available
const defaultImage = '/game/default-image.png';
// Backup default if even that fails
const hardcodedDefault = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmQzMjM4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmYTUwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+R2FtZSBDb3ZlcjwvdGV4dD48L3N2Zz4=';

// Function to get image from localStorage - moved outside component for first-render access
const getFromLocalCache = (key) => {
  try {
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(`cover_${key}`);
      if (cachedData) {
        const { url } = JSON.parse(cachedData);
        return url;
      }
    }
    return null;
  } catch (err) {
    return null;
  }
};

export default function EnhancedGameCover({ 
  game, 
  width = 300, 
  height = 200, 
  className = '',
  source = 'wikimedia', // Default to wikimedia. Options: 'wikimedia', 'screenscraper', 'tgdb', or 'auto'
  hideInternalBadges = false
}) {
  // Immediate image determination for first render
  const getInitialImage = () => {
    if (!game) return null;
    
    // Handle file:// URLs directly
    if (game.image && game.image.startsWith('file://')) {
      console.log(`[EnhancedGameCover] Using direct file URL: ${game.image}`);
      return game.image;
    }
    
    // Handle our custom app-local:// protocol
    if (game.image && game.image.startsWith('app-local://')) {
      const filename = game.image.replace('app-local://', '');
      const imagePath = `/game/${filename}`;
      console.log(`[EnhancedGameCover] Using app-local image, loading from: ${imagePath}`);
      return imagePath;
    }
    
    // 1. Direct local image path (fastest)
    if (game.image && !game.image.includes(':') && !game.image.includes('default-image')) {
      // Check if the image is an absolute path or relative to /game/
      const imagePath = game.image.startsWith('/') 
        ? game.image 
        : `/game/${game.image}`;
      
      console.log(`[EnhancedGameCover] Using local image: ${imagePath}`);
      return imagePath;
    }
    
    // 2. External URL (also fast)
    if (game.image && (game.image.startsWith('http://') || game.image.startsWith('https://'))) {
      return game.image;
    }
    
    // 3. Check memory cache
    const cacheKey = game.image || `${source}:${game.title}:${game.core}`;
    if (coverCache.has(cacheKey)) {
      return coverCache.get(cacheKey);
    }
    
    // 4. Check localStorage cache
    const cachedUrl = getFromLocalCache(cacheKey);
    if (cachedUrl) {
      // Update in-memory cache for next time
      coverCache.set(cacheKey, cachedUrl);
      return cachedUrl;
    }
    
    // No immediate image available
    return null;
  };

  const [coverUrl, setCoverUrl] = useState(getInitialImage);
  const [loading, setLoading] = useState(!getInitialImage());
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(!!getInitialImage() && 
    (getInitialImage()?.startsWith('http') || (getInitialImage()?.includes(':') && !getInitialImage()?.startsWith('file:'))));

  useEffect(() => {
    // Skip fetch if we already have an image from initialization
    if (coverUrl) {
      setLoading(false);
      return;
    }
    
    if (!game) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const cacheKey = game.image || `${source}:${game.title}:${game.core}`;

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

    const attemptImageFetch = async () => {
      // Try to use a special image reference
      if (game.image) {
        if (game.image.startsWith('tgdb:')) {
            fetchTGDBImage(game.image);
          return;
        } 
        
        if (game.image.startsWith('screenscraper:')) {
            fetchScreenscraperImage(game.image);
          return;
        }
        
        if (game.image.startsWith('wikimedia:')) {
          try {
            // Extract title from reference
            const parts = game.image.split(':');
            if (parts.length >= 2) {
              const title = decodeURIComponent(parts[1]);
              // Use game-images API to fetch from Wikimedia
              const response = await fetch(`/api/game-images?name=${encodeURIComponent(title)}${game.core ? `&console=${encodeURIComponent(game.core)}` : ''}`);
              const data = await response.json();
              
                  if (data.success && data.imageUrl) {
                    setCoverUrl(data.imageUrl);
                saveToLocalCache(game.image, data.imageUrl);
              }
            }
          } catch (err) {
            setError('Wikimedia image not available');
          } finally {
            setLoading(false);
          }
          return;
        }
      }
      
      // If no special reference but have title and core, try to fetch based on source
      if (game.title && game.core) {
          fetchGameCover(source);
        return;
      }
      
      // No way to get an image
      setLoading(false);
    };

    // Start the fetch process
    attemptImageFetch();
  }, [game, source]);

  // Extract image from HTML - Same implementation as before
  const extractImageFromHtml = (html) => {
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
        
        // Remove "video game" suffix and just use title and core for better search results
        const searchQuery = `${game.title} ${game.core}`;
        console.log(`[EnhancedGameCover] ===== SEARCH QUERY =====`);
        console.log(`[EnhancedGameCover] Game Title: ${game.title}`);
        console.log(`[EnhancedGameCover] Console: ${game.core}`);
        console.log(`[EnhancedGameCover] Final Search Query: "${searchQuery}"`);
        console.log(`[EnhancedGameCover] ======================`);
        
        // Limit results to 3 for faster loading
        const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*&srlimit=3`);
        
        if (!searchResponse.ok) {
          throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
        }
        
        const searchData = await searchResponse.json();
        console.log(`[EnhancedGameCover] Search results:`, searchData.query ? `Found ${searchData.query.search?.length || 0} results` : 'No results');
        
        if (!searchData.query?.search || searchData.query.search.length === 0) {
          throw new Error('No search results found');
        }
        
        // Filter out unwanted results like "List of..." entries or console-only entries
        const filteredResults = searchData.query.search.filter(result => {
          const title = result.title.toLowerCase();
          
          // Reject results that start with "List of"
          if (title.startsWith("list of")) return false;
          
          // Reject results that are just console names
          if (title === game.core.toLowerCase()) return false;
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
      
      {/* Handle file:// URLs specially */}
      {coverUrl && coverUrl.startsWith('file://') ? (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-accent">
          <div className="p-4 text-center">
            <HiPhotograph className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Local file:<br />{coverUrl.replace('file://', '')}</p>
          </div>
        </div>
      ) : coverUrl && coverUrl.startsWith('/game/') ? (
        // Use standard img tag ONLY for local files in the /game/ directory
        <img
          src={coverUrl}
          alt={game?.title || 'Game Cover'}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            console.error(`[EnhancedGameCover] Error loading image: ${coverUrl}`, e);
            // If a specific game image fails, fall back to the hardcoded SVG
            setCoverUrl(hardcodedDefault);
          }}
          loading="eager"
          fetchPriority="high"
        />
      ) : coverUrl ? (
        // Use Next.js Image for everything else (http URLs, API sources, etc.)
        <Image
          src={coverUrl}
          width={width}
          height={height}
          alt={game?.title || 'Game Cover'}
          quality={90}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={() => setCoverUrl(hardcodedDefault)}
          loading="eager"
          priority={true}
        />
      ) : (
        // When all else fails, use the hardcoded data URL with standard img
        <img
          src={hardcodedDefault}
          alt={game?.title || 'Game Cover'}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          width={width}
          height={height}
          loading="eager"
        />
      )}
      
      {error && !coverUrl && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-accent text-xs p-1 text-center">
          {error}
        </div>
      )}
      
      {isFromCache && coverUrl && !hideInternalBadges && (
        <div className="absolute top-0 right-0 bg-green-500/80 text-white text-xs px-1 py-0.5 rounded-bl">
          Cached
        </div>
      )}
    </div>
  );
}

// Update the fetchGameCover function to include Wikipedia option
export async function fetchGameCover(gameTitle, core, preferredSource = 'auto') {
  if (!gameTitle || !core) {
    throw new Error('Missing game title or core');
  }

  console.log(`[fetchGameCover] Starting fetch for ${gameTitle}, ${core} using source: ${preferredSource}`);

  // Generate cache key
  const cacheKey = `${preferredSource}:${gameTitle}:${core}`;
  
  // Check in-memory cache
  if (coverCache.has(cacheKey)) {
    return {
      url: coverCache.get(cacheKey),
      source: preferredSource,
      fromCache: true
    };
  }
  
  // Check localStorage cache
  const cachedUrl = getFromLocalCache(cacheKey);
  if (cachedUrl) {
    coverCache.set(cacheKey, cachedUrl);
    return {
      url: cachedUrl,
      source: preferredSource,
      fromCache: true
    };
  }
  
  if (preferredSource === 'auto' || preferredSource === 'wikimedia') {
    try {
      console.log(`[fetchGameCover] Using Wiki Image Extraction method for: ${gameTitle}`);
      
      // Remove "video game" suffix and just use title and core for better search results
      const searchQuery = `${gameTitle} ${core}`;
      console.log(`[fetchGameCover] ===== SEARCH QUERY =====`);
      console.log(`[fetchGameCover] Game Title: ${gameTitle}`);
      console.log(`[fetchGameCover] Console: ${core}`);
      console.log(`[fetchGameCover] Final Search Query: "${searchQuery}"`);
      console.log(`[fetchGameCover] ======================`);
      
      // Limit results to 3 for faster loading
      const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*&srlimit=3`);
      
      if (!searchResponse.ok) {
        throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      console.log(`[fetchGameCover] Search results:`, searchData.query ? `Found ${searchData.query.search?.length || 0} results` : 'No results');
      
      if (!searchData.query?.search || searchData.query.search.length === 0) {
        throw new Error('No search results found');
      }
      
      // Filter out unwanted results like "List of..." entries or console-only entries
      const filteredResults = searchData.query.search.filter(result => {
        const title = result.title.toLowerCase();
        
        // Reject results that start with "List of"
        if (title.startsWith("list of")) return false;
        
        // Reject results that are just console names
        if (title === core.toLowerCase()) return false;
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
      console.log(`[fetchGameCover] Found exact title: "${exactTitle}"`);
      
      // Step 2: Now fetch the raw HTML content to extract images - Same as in Wiki Image Extraction Test
      console.log(`[fetchGameCover] Step 2 - Fetching HTML content for: ${exactTitle}`);
      const contentResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(exactTitle)}&prop=text&format=json&origin=*`);
      
      if (!contentResponse.ok) {
        throw new Error(`Failed to fetch page content: ${contentResponse.status}`);
      }
      
      const contentData = await contentResponse.json();
      if (!contentData.parse?.text?.['*']) {
        throw new Error('No HTML content found');
      }
      
      const htmlContent = contentData.parse.text['*'];
      console.log(`[fetchGameCover] Received HTML content (${htmlContent.length} chars)`);
      
      // Now extract the image from the HTML - Same as in Wiki Image Extraction Test
      let extractedImageUrl = extractImageFromHtml(htmlContent);
      
      if (extractedImageUrl) {
        console.log(`[fetchGameCover] Successfully extracted image: ${extractedImageUrl}`);
        
        // Store the result
        coverCache.set(cacheKey, extractedImageUrl);
        
        // Cache in localStorage permanently
        try {
        if (typeof localStorage !== 'undefined') {
            const cacheData = {
              url: extractedImageUrl,
              title: exactTitle,
              source: 'wikimedia',
              timestamp: Date.now()
            };
            localStorage.setItem(`cover_${cacheKey}`, JSON.stringify(cacheData));
          }
        } catch (err) {
          console.error("[fetchGameCover] Error saving to localStorage:", err);
        }
        
        return {
          url: extractedImageUrl,
          source: 'wikimedia',
          fromCache: false
        };
      }
      
      // Step 3: If no image found in HTML, try the thumbnail API - Same as in Wiki Image Extraction Test
      console.log(`[fetchGameCover] Step 3 - No image in HTML, trying thumbnail API for: ${exactTitle}`);
      const thumbnailResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(exactTitle)}&prop=pageimages&format=json&pithumbsize=500&origin=*`);
      
      if (thumbnailResponse.ok) {
        const thumbnailData = await thumbnailResponse.json();
        const pages = thumbnailData.query?.pages;
        
        if (pages) {
          const pageId = Object.keys(pages)[0];
          const thumbnail = pages[pageId]?.thumbnail?.source;
          
          if (thumbnail) {
            console.log(`[fetchGameCover] Found thumbnail: ${thumbnail}`);
            
            // Store the result
            coverCache.set(cacheKey, thumbnail);
            
            // Cache in localStorage permanently
            try {
              if (typeof localStorage !== 'undefined') {
                const cacheData = {
                  url: thumbnail,
                  title: exactTitle,
                  source: 'wikimedia',
                  timestamp: Date.now()
                };
                localStorage.setItem(`cover_${cacheKey}`, JSON.stringify(cacheData));
              }
            } catch (err) {
              console.error("[fetchGameCover] Error saving to localStorage:", err);
            }
            
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
      console.error('[fetchGameCover] Error fetching Wikimedia image:', err);
      throw err;
    }
  } else {
    throw new Error(`Unknown source: ${preferredSource}`);
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