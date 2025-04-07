import { NextResponse } from 'next/server';

/**
 * Wikimedia API handler for searching articles and fetching full infobox
 */
export async function GET(request) {
  console.log('[WIKIMEDIA:API] Received search request');
  
  try {
    // Get the search parameter from the URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    if (!search) {
      console.log('[WIKIMEDIA:API] No search term provided');
      return NextResponse.json({ error: { info: 'No search term provided' } }, { status: 400 });
    }
    
    console.log(`[WIKIMEDIA:API] Searching for: "${search}"`);
    
    // Use the public MediaWiki API that doesn't require authentication
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(search)}&format=json&origin=*`;
    
    console.log(`[WIKIMEDIA:API] Fetching from: ${apiUrl}`);
    
    // Make the request to MediaWiki API
    const response = await fetch(apiUrl);
    
    console.log(`[WIKIMEDIA:API] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WIKIMEDIA:API] MediaWiki API error: ${errorText}`);
      return NextResponse.json({ error: { info: `MediaWiki API error: ${response.status}` } }, { status: response.status });
    }
    
    const data = await response.json();
    console.log('[WIKIMEDIA:API] Successfully received data from MediaWiki');
    
    if (!data.query || !data.query.search) {
      console.log('[WIKIMEDIA:API] No search results found in response');
      return NextResponse.json({ 
        query: { search: [] } 
      });
    }
    
    // Get only the first 3 results
    const limitedResults = data.query.search.slice(0, 3);
    console.log(`[WIKIMEDIA:API] Limited to first ${limitedResults.length} results`);
    
    // For each result, get detailed information
    const resultsWithDetails = await Promise.all(
      limitedResults.map(async (result) => {
        try {
          console.log(`[WIKIMEDIA:API] Processing page: ${result.title} (ID: ${result.pageid})`);
          
          // 1. Get thumbnail image using pageimages
          const thumbnailUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
          console.log(`[WIKIMEDIA:API] Fetching thumbnail for: ${result.title}`);
          
          const thumbnailResponse = await fetch(thumbnailUrl);
          let thumbnail = null;
          
          if (thumbnailResponse.ok) {
            const thumbnailData = await thumbnailResponse.json();
            const pages = thumbnailData.query?.pages;
            
            if (pages) {
              const pageId = Object.keys(pages)[0];
              thumbnail = pages[pageId]?.thumbnail?.source;
              
              if (thumbnail) {
                console.log(`[WIKIMEDIA:API] Found thumbnail for ${result.title}: ${thumbnail}`);
              }
            }
          }
          
          // 2. Get page content to extract infobox data
          const contentUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(result.title)}&prop=text|categories&format=json&origin=*`;
          console.log(`[WIKIMEDIA:API] Fetching page content for: ${result.title}`);
          
          const contentResponse = await fetch(contentUrl);
          let infoboxData = {};
          let fullInfoboxHtml = null;
          let isVideoGame = false;
          
          if (contentResponse.ok) {
            const contentData = await contentResponse.json();
            
            // Check if this is a video game article by looking at categories
            if (contentData.parse?.categories) {
              isVideoGame = contentData.parse.categories.some(cat => 
                cat['*']?.toLowerCase().includes('video game') || 
                cat['*']?.toLowerCase().includes('video games'));
              
              console.log(`[WIKIMEDIA:API] Page ${result.title} is ${isVideoGame ? 'a video game' : 'not a video game'}`);
            }
            
            if (contentData.parse?.text?.['*']) {
              const htmlContent = contentData.parse.text['*'];
              
              // Extract the full infobox HTML
              console.log(`[WIKIMEDIA:API] Extracting full infobox HTML for ${result.title}`);
              
              // Try different infobox class patterns (video game, general, etc.)
              const infoboxPatterns = [
                /<table class="[^"]*infobox[^"]*vg[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
                /<table class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
                /<table class="[^"]*infobox[^"]*vevent[^"]*"[^>]*>([\s\S]*?)<\/table>/i
              ];
              
              let infoboxMatch = null;
              for (const pattern of infoboxPatterns) {
                infoboxMatch = htmlContent.match(pattern);
                if (infoboxMatch && infoboxMatch[0]) {
                  fullInfoboxHtml = infoboxMatch[0];
                  console.log(`[WIKIMEDIA:API] Found infobox HTML for ${result.title} (${fullInfoboxHtml.length} chars)`);
                  
                  // Process the infobox to fix relative image URLs and styles
                  fullInfoboxHtml = processInfoboxHtml(fullInfoboxHtml);
                  break;
                }
              }
              
              if (!fullInfoboxHtml) {
                console.log(`[WIKIMEDIA:API] No infobox found for ${result.title}`);
              }
              
              // Extract text data from infobox (as fallback and for filtering)
              // Developer(s)
              const developerMatch = htmlContent.match(/<th.*?>(?:Developer|Developers|Developer\(s\))<\/th>[\s\S]*?<td.*?>([\s\S]*?)<\/td>/i);
              if (developerMatch && developerMatch[1]) {
                let developer = cleanHtml(developerMatch[1]);
                infoboxData.developer = developer;
                console.log(`[WIKIMEDIA:API] Developer: ${developer}`);
              }
              
              // Publisher(s)
              const publisherMatch = htmlContent.match(/<th.*?>(?:Publisher|Publishers|Publisher\(s\))<\/th>[\s\S]*?<td.*?>([\s\S]*?)<\/td>/i);
              if (publisherMatch && publisherMatch[1]) {
                let publisher = cleanHtml(publisherMatch[1]);
                infoboxData.publisher = publisher;
                console.log(`[WIKIMEDIA:API] Publisher: ${publisher}`);
              }
              
              // Release date(s)
              const releaseDateMatch = htmlContent.match(/<th.*?>(?:Release|Released|Release date|Release dates)<\/th>[\s\S]*?<td.*?>([\s\S]*?)<\/td>/i);
              if (releaseDateMatch && releaseDateMatch[1]) {
                let releaseDate = cleanHtml(releaseDateMatch[1]);
                infoboxData.releaseDate = releaseDate;
                console.log(`[WIKIMEDIA:API] Release date: ${releaseDate}`);
              }
              
              // Platform(s)
              const platformMatch = htmlContent.match(/<th.*?>(?:Platform|Platforms|Platform\(s\))<\/th>[\s\S]*?<td.*?>([\s\S]*?)<\/td>/i);
              if (platformMatch && platformMatch[1]) {
                let platforms = cleanHtml(platformMatch[1]);
                infoboxData.platforms = platforms;
                console.log(`[WIKIMEDIA:API] Platforms: ${platforms}`);
              }
              
              // Genre(s)
              const genreMatch = htmlContent.match(/<th.*?>(?:Genre|Genres|Genre\(s\))<\/th>[\s\S]*?<td.*?>([\s\S]*?)<\/td>/i);
              if (genreMatch && genreMatch[1]) {
                let genre = cleanHtml(genreMatch[1]);
                infoboxData.genre = genre;
                console.log(`[WIKIMEDIA:API] Genre: ${genre}`);
              }
              
              // Mode(s)
              const modeMatch = htmlContent.match(/<th.*?>(?:Mode|Modes|Mode\(s\))<\/th>[\s\S]*?<td.*?>([\s\S]*?)<\/td>/i);
              if (modeMatch && modeMatch[1]) {
                let mode = cleanHtml(modeMatch[1]);
                infoboxData.mode = mode;
                console.log(`[WIKIMEDIA:API] Mode: ${mode}`);
              }
            }
          }
          
          // 3. Get additional images from page
          const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=images&format=json&imlimit=10&origin=*`;
          console.log(`[WIKIMEDIA:API] Fetching image list for: ${result.title}`);
          
          const imagesResponse = await fetch(imagesUrl);
          let imagesInfo = [];
          
          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json();
            const pages = imagesData.query?.pages;
            
            if (pages) {
              const pageId = Object.keys(pages)[0];
              const imageList = pages[pageId]?.images || [];
              
              console.log(`[WIKIMEDIA:API] Found ${imageList.length} images in page ${result.title}`);
              
              // Filter images to get content images (not icons, logos, etc.)
              const filteredImages = imageList
                .filter(img => {
                  const title = img.title.toLowerCase();
                  return (
                    !title.includes('icon') && 
                    !title.includes('logo') && 
                    !title.endsWith('.svg') && 
                    !title.includes('symbol') &&
                    !title.includes('arrow')
                  );
                })
                .slice(0, 5);
              
              // Get image details for each image
              if (filteredImages.length > 0) {
                // Build a query to get image info (urls) for multiple images at once
                const imageDetailParams = filteredImages
                  .map(img => `File:${img.title.replace(/^File:/, '')}`)
                  .join('|');
                
                const imageDetailUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(imageDetailParams)}&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
                console.log(`[WIKIMEDIA:API] Fetching image details for ${filteredImages.length} images`);
                
                const imageDetailResponse = await fetch(imageDetailUrl);
                
                if (imageDetailResponse.ok) {
                  const imageDetailData = await imageDetailResponse.json();
                  const imagePages = imageDetailData.query?.pages || {};
                  
                  // Process each image's details
                  imagesInfo = Object.values(imagePages)
                    .filter(page => page.imageinfo && page.imageinfo.length > 0)
                    .map(page => {
                      const info = page.imageinfo[0];
                      console.log(`[WIKIMEDIA:API] Image: ${page.title} - Size: ${info.width}x${info.height} - URL: ${info.url}`);
                      return {
                        id: page.pageid,
                        title: page.title,
                        url: info.url,
                        width: info.width,
                        height: info.height
                      };
                    })
                    .filter(img => img.width >= 100 && img.height >= 100) // Filter out tiny images
                    .slice(0, 3); // Get top 3 images
                  
                  console.log(`[WIKIMEDIA:API] Got ${imagesInfo.length} usable images for ${result.title}`);
                }
              }
            }
          }
          
          // Return result with all the data
          return {
            ...result,
            thumbnail,
            images: imagesInfo,
            imageIds: imagesInfo.map(img => `${img.id}: ${img.title}`).join(', '),
            isVideoGame,
            infobox: infoboxData,
            fullInfoboxHtml
          };
        } catch (error) {
          console.error(`[WIKIMEDIA:API] Error processing page ${result.title}:`, error);
          return result;
        }
      })
    );
    
    console.log(`[WIKIMEDIA:API] Returning ${resultsWithDetails.length} results with details`);
    
    return NextResponse.json({
      query: {
        search: resultsWithDetails
      }
    });
    
  } catch (error) {
    console.error('[WIKIMEDIA:API] Error handling request:', error);
    return NextResponse.json({ error: { info: `Server error: ${error.message}` } }, { status: 500 });
  }
}

/**
 * Process infobox HTML to fix relative URLs and remove problematic styles
 */
function processInfoboxHtml(html) {
  // Fix relative image URLs
  let processed = html.replace(/src="\/\/upload\.wikimedia\.org/g, 'src="https://upload.wikimedia.org');
  
  // Fix relative URLs in hrefs
  processed = processed.replace(/href="\/wiki/g, 'href="https://en.wikipedia.org/wiki');
  
  // Add custom styles to make the infobox display properly
  processed = processed.replace(/<table class="/g, '<table style="width:100%; max-width:400px; background-color:#f8f9fa; color:#202122; border:1px solid #a2a9b1; border-spacing:0.4em; border-collapse:collapse; margin:0 auto;" class="');
  
  // Remove potentially problematic styles or scripts
  processed = processed.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  processed = processed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  return processed;
}

/**
 * Helper function to clean HTML content from infobox values
 */
function cleanHtml(html) {
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // Fix spacing issues
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove citation references [1], [2], etc.
  text = text.replace(/\[\d+\]/g, '');
  
  return text;
} 