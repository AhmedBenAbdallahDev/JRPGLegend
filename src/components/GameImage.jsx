'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * GameImage component
 * 
 * This component automatically loads game images from either:
 * 1. The provided imageLink (if it exists)
 * 2. Wikimedia API (if no imageLink is provided) - using the same method as Wiki Image Extraction Test
 * 
 * @param {Object} props
 * @param {string} props.title - Game title for Wikimedia search
 * @param {string} props.core - Game system/core for better search results
 * @param {string} props.imageLink - Optional direct image link
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.width - Width of the image container
 * @param {number} props.height - Height of the image container
 * @param {Function} props.onLoad - Callback when image loads successfully
 * @param {Function} props.onError - Callback when image fails to load
 * @param {string} props.region - Game region (us, jp, eu) - affects search terms
 */
export default function GameImage({ 
  title, 
  core, 
  imageLink, 
  alt = "Game cover", 
  className = "", 
  width = 100, 
  height = 100,
  onLoad,
  onError,
  region = null
}) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromWikimedia, setFromWikimedia] = useState(false);
  
  // Function to get a search title with console name
  const getSearchTitle = (baseTitle, gameCore) => {
    if (!gameCore) {
      return `${baseTitle} video game`;
    }
    return `${baseTitle} ${gameCore} video game`;
  };
  
  useEffect(() => {
    // Reset state when props change
    setSrc(null);
    setLoading(true);
    setError(null);
    setFromWikimedia(false);
    
    console.log(`[GameImage] Processing image for game: "${title}" (${core || 'unknown core'}) [Region: ${region || 'us'}]`);
    console.log(`[GameImage] imageLink from DB: ${imageLink || 'NOT FOUND (empty/null)'}`);
    
    // If imageLink is provided, use it directly
    if (imageLink) {
      console.log(`[GameImage] Using provided imageLink: ${imageLink}`);
      
      // Check if this is a wikimedia flag
      if (imageLink.startsWith('wikimedia:')) {
        console.log(`[GameImage] This is a wikimedia flag, extracting title`);
        const encodedTitle = imageLink.substring(10); // Remove "wikimedia:" prefix
        const gameTitle = decodeURIComponent(encodedTitle);
        
        console.log(`[GameImage] Extracted game title from flag: ${gameTitle}`);
        // Now fetch using the same method as Wiki Image Extraction Test
        fetchWikimediaImage(gameTitle);
        return;
      }
      
      // Check if this is a full URL (http:// or https://)
      if (imageLink.startsWith('http://') || imageLink.startsWith('https://')) {
        console.log(`[GameImage] This is a full external URL, using directly: ${imageLink}`);
        setSrc(imageLink);
        setLoading(false);
        return;
      }
      
      // Otherwise assume it's a local path
      console.log(`[GameImage] Using as local path: ${imageLink}`);
      setSrc(imageLink);
      setLoading(false);
      return;
    }
    
    // Otherwise, fetch from Wikimedia using the same method as Wiki Image Extraction Test
    if (title) {
      fetchWikimediaImage(title);
    } else {
      setLoading(false);
      setError('No title provided for image search');
    }
  }, [title, core, imageLink, region]);
  
  // This function mirrors the exact approach from the Wiki Image Extraction Test page
  const fetchWikimediaImage = async (searchTitle) => {
    try {
      console.log(`[GameImage] Using Wiki Image Extraction method for: ${searchTitle}`);
      setLoading(true);
      
      // Step 1: First, search for the page to get the exact title - EXACTLY as in Wiki Image Extraction Test
      console.log(`[GameImage] Step 1 - Searching for: ${searchTitle}`);
      const searchQuery = getSearchTitle(searchTitle, core);
      console.log(`[GameImage] ===== SEARCH QUERY =====`);
      console.log(`[GameImage] Game Title: ${searchTitle}`);
      console.log(`[GameImage] Console: ${core || 'none'}`);
      console.log(`[GameImage] Final Search Query: "${searchQuery}"`);
      console.log(`[GameImage] ======================`);
      
      const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`);
      
      if (!searchResponse.ok) {
        throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      console.log(`[GameImage] Search results:`, searchData.query ? `Found ${searchData.query.search?.length || 0} results` : 'No results');
      
      if (!searchData.query?.search || searchData.query.search.length === 0) {
        throw new Error('No search results found');
      }
      
      // Get the exact title from the first search result
      const exactTitle = searchData.query.search[0].title;
      console.log(`[GameImage] Found exact title: "${exactTitle}"`);
      
      // Step 2: Now fetch the raw HTML content to extract images - EXACTLY as in Wiki Image Extraction Test
      console.log(`[GameImage] Step 2 - Fetching HTML content for: ${exactTitle}`);
      const contentResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(exactTitle)}&prop=text&format=json&origin=*`);
      
      if (!contentResponse.ok) {
        throw new Error(`Failed to fetch page content: ${contentResponse.status}`);
      }
      
      const contentData = await contentResponse.json();
      if (!contentData.parse?.text?.['*']) {
        throw new Error('No HTML content found');
      }
      
      const htmlContent = contentData.parse.text['*'];
      console.log(`[GameImage] Received HTML content (${htmlContent.length} chars)`);
      
      // Now extract the image from the HTML - EXACTLY as in Wiki Image Extraction Test
      let extractedImageUrl = extractImageFromHtml(htmlContent);
      
      if (extractedImageUrl) {
        console.log(`[GameImage] Successfully extracted image: ${extractedImageUrl}`);
        
        // Set the image URL and mark as from Wikimedia
        setSrc(extractedImageUrl);
        setFromWikimedia(true);
        setLoading(false);
        
        // Call the onLoad callback with the image URL
        if (onLoad) {
          onLoad(extractedImageUrl);
        }
        
        return;
      }
      
      // Step 3: If no image found in HTML, try the thumbnail API - EXACTLY as in Wiki Image Extraction Test
      console.log(`[GameImage] Step 3 - No image in HTML, trying thumbnail API for: ${exactTitle}`);
      const thumbnailResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(exactTitle)}&prop=pageimages&format=json&pithumbsize=500&origin=*`);
      
      if (thumbnailResponse.ok) {
        const thumbnailData = await thumbnailResponse.json();
        const pages = thumbnailData.query?.pages;
        
        if (pages) {
          const pageId = Object.keys(pages)[0];
          const thumbnail = pages[pageId]?.thumbnail?.source;
          
          if (thumbnail) {
            console.log(`[GameImage] Found thumbnail: ${thumbnail}`);
            setSrc(thumbnail);
            setFromWikimedia(true);
            setLoading(false);
            
            if (onLoad) {
              onLoad(thumbnail);
            }
            
            return;
          }
        }
      }
      
      // If we still don't have an image, show error
      throw new Error('No image found for this game');
      
    } catch (err) {
      console.error(`[GameImage] Error fetching image for "${searchTitle}":`, err);
      setError(err.message);
      setLoading(false);
      
      if (onError) {
        onError(err);
      }
    }
  };
  
  // Extract image from HTML - EXACTLY the same function as in Wiki Image Extraction Test
  const extractImageFromHtml = (html) => {
    if (!html) return null;
    
    // Try to find the infobox - EXACTLY as in Wiki Image Extraction Test
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
        console.log(`[GameImage] Found infobox HTML (${infoboxHtml.length} chars)`);
        break;
      }
    }
    
    if (!infoboxHtml) {
      console.log(`[GameImage] No infobox found in the page`);
      return null;
    }
    
    // Try to find the image in the second row - EXACTLY as in Wiki Image Extraction Test
    const rows = infoboxHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (rows && rows.length >= 2) {
      const imageMatch = rows[1].match(/<img[^>]*src="([^"]*)"[^>]*>/i);
      if (imageMatch && imageMatch[1]) {
        let imageUrl = imageMatch[1];
        if (imageUrl.startsWith('//')) {
          imageUrl = `https:${imageUrl}`;
        }
        console.log(`[GameImage] Found image in second row: ${imageUrl}`);
        return imageUrl;
      }
    }
    
    // If no image in second row, try to find any image in the infobox - EXACTLY as in Wiki Image Extraction Test
    const imageMatch = infoboxHtml.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
    if (imageMatch && imageMatch[1]) {
      let imageUrl = imageMatch[1];
      if (imageUrl.startsWith('//')) {
        imageUrl = `https:${imageUrl}`;
      }
      console.log(`[GameImage] Found image in infobox: ${imageUrl}`);
      return imageUrl;
    }
    
    console.log(`[GameImage] No image found in infobox`);
    return null;
  };
  
  const handleImageError = (e) => {
    console.error(`[GameImage] Image load error for "${title}": ${src}`);
    setError('Failed to load image');
    
    if (onError) {
      onError(new Error('Image failed to load'));
    }
  };
  
  const handleImageLoad = () => {
    console.log(`[GameImage] Image loaded successfully for "${title}": ${src}`);
    if (onLoad && !fromWikimedia) { // Only call onLoad for non-Wikimedia images to avoid duplicate calls
      onLoad(src);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div 
        className={`relative bg-gray-800 flex items-center justify-center ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="animate-pulse flex space-x-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error || !src) {
    return (
      <div 
        className={`relative bg-gray-800 flex items-center justify-center ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-xs text-center text-gray-500 p-2">
          No image available
        </div>
      </div>
    );
  }
  
  // Show image - use direct img tag for all images to avoid Next.js Image issues
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <img
        src={src}
        alt={alt}
        className="object-cover w-full h-full"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      {fromWikimedia && (
        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-1">
          Wiki
        </div>
      )}
    </div>
  );
} 