import { NextResponse } from 'next/server';

/**
 * Wikimedia API handler for fetching images from Wikipedia articles
 */
export async function GET(request) {
  console.log('[WIKIMEDIA:IMAGES] Received image request');
  
  try {
    // Get the page title parameter from the URL
    const { searchParams } = new URL(request.url);
    const pageTitle = searchParams.get('title');
    
    if (!pageTitle) {
      console.log('[WIKIMEDIA:IMAGES] No page title provided');
      return NextResponse.json({ error: { info: 'No page title provided' } }, { status: 400 });
    }
    
    console.log(`[WIKIMEDIA:IMAGES] Fetching images for: "${pageTitle}"`);
    
    // 1. Get the page content to extract infobox and image
    const contentUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json&origin=*`;
    console.log(`[WIKIMEDIA:IMAGES] Fetching page content for: ${pageTitle}`);
    
    const contentResponse = await fetch(contentUrl);
    let infoboxHtml = null;
    let infoboxImage = null;
    
    if (contentResponse.ok) {
      const contentData = await contentResponse.json();
      
      if (contentData.parse?.text?.['*']) {
        const htmlContent = contentData.parse.text['*'];
        
        // Try to extract the infobox HTML
        const infoboxPatterns = [
          /<table class="[^"]*infobox[^"]*vg[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
          /<table class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
          /<table class="[^"]*infobox[^"]*vevent[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
          /<table class="[^"]*infobox[^"]*game[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
          /<table class="[^"]*infobox[^"]*software[^"]*"[^>]*>([\s\S]*?)<\/table>/i
        ];
        
        for (const pattern of infoboxPatterns) {
          const infoboxMatch = htmlContent.match(pattern);
          if (infoboxMatch && infoboxMatch[0]) {
            infoboxHtml = infoboxMatch[0];
            console.log(`[WIKIMEDIA:IMAGES] Found infobox HTML for ${pageTitle} (${infoboxHtml.length} chars)`);
            
            // Extract the image from the second row of the infobox
            // The first row typically has the title, the second row has the image
            const rows = infoboxHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
            if (rows && rows.length >= 2) {
              // Look for an image in the second row
              const imageMatch = rows[1].match(/<img[^>]*src="([^"]*)"[^>]*>/i);
              if (imageMatch && imageMatch[1]) {
                infoboxImage = imageMatch[1];
                // Fix relative URLs
                if (infoboxImage.startsWith('//')) {
                  infoboxImage = `https:${infoboxImage}`;
                }
                console.log(`[WIKIMEDIA:IMAGES] Found infobox image from second row: ${infoboxImage}`);
                break;
              }
            }
            
            // If no image found in second row, try to find any image in the infobox
            if (!infoboxImage) {
              const imageMatch = infoboxHtml.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
              if (imageMatch && imageMatch[1]) {
                infoboxImage = imageMatch[1];
                // Fix relative URLs
                if (infoboxImage.startsWith('//')) {
                  infoboxImage = `https:${infoboxImage}`;
                }
                console.log(`[WIKIMEDIA:IMAGES] Found infobox image: ${infoboxImage}`);
              }
            }
            
            if (infoboxImage) break;
          }
        }
        
        // If no infobox image found, try to find any image in the page
        if (!infoboxImage) {
          console.log(`[WIKIMEDIA:IMAGES] No infobox image found, trying to find any image in the page`);
          
          // Look for the first image in the page
          const imageMatch = htmlContent.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
          if (imageMatch && imageMatch[1]) {
            infoboxImage = imageMatch[1];
            // Fix relative URLs
            if (infoboxImage.startsWith('//')) {
              infoboxImage = `https:${infoboxImage}`;
            }
            console.log(`[WIKIMEDIA:IMAGES] Found page image: ${infoboxImage}`);
          }
        }
      }
    }
    
    // 2. Get thumbnail image using pageimages (as fallback)
    const thumbnailUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
    console.log(`[WIKIMEDIA:IMAGES] Fetching thumbnail for: ${pageTitle}`);
    
    const thumbnailResponse = await fetch(thumbnailUrl);
    let thumbnail = null;
    
    if (thumbnailResponse.ok) {
      const thumbnailData = await thumbnailResponse.json();
      const pages = thumbnailData.query?.pages;
      
      if (pages) {
        const pageId = Object.keys(pages)[0];
        thumbnail = pages[pageId]?.thumbnail?.source;
        
        if (thumbnail) {
          console.log(`[WIKIMEDIA:IMAGES] Found thumbnail for ${pageTitle}: ${thumbnail}`);
        }
      }
    }
    
    // Return all image data
    return NextResponse.json({
      title: pageTitle,
      thumbnail: infoboxImage || thumbnail, // Use infobox image if available, otherwise use thumbnail
      infoboxImage,
      infoboxHtml,
      imageIds: infoboxImage ? `Infobox image: ${infoboxImage}` : 'No infobox image found'
    });
    
  } catch (error) {
    console.error('[WIKIMEDIA:IMAGES] Error handling request:', error);
    return NextResponse.json({ error: { info: `Server error: ${error.message}` } }, { status: 500 });
  }
} 