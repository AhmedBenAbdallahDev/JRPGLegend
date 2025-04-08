'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiSearch, FiImage, FiCode, FiBox, FiInfo, FiAlertCircle, FiExternalLink } from 'react-icons/fi';

export default function TestWikiImageExtractionPage() {
  const [pageTitle, setPageTitle] = useState('Castlevania 64');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [rawHtml, setRawHtml] = useState(null);
  
  const handleFetchImages = async () => {
    setLoading(true);
    setError(null);
    setSearchResults(null);
    setRawHtml(null);
    
    try {
      // First, search for the page to get the exact title
      console.log(`Searching for: ${pageTitle}`);
      const searchResponse = await fetch(`/api/wikimedia?search=${encodeURIComponent(pageTitle)}`);
      
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(errorData.error?.info || 'Failed to search for page');
      }
      
      const searchData = await searchResponse.json();
      console.log('Search results:', searchData);
      setSearchResults(searchData);
      
      if (!searchData.query?.search || searchData.query.search.length === 0) {
        throw new Error('No search results found');
      }
      
      // Try the first search result
      let exactTitle = searchData.query.search[0].title;
      let currentSearchIndex = 0;
      let foundValidImage = false;
      
      // Try up to the first 3 search results until we find a valid image
      while (!foundValidImage && currentSearchIndex < Math.min(3, searchData.query.search.length)) {
        exactTitle = searchData.query.search[currentSearchIndex].title;
        console.log(`Trying title ${currentSearchIndex + 1}: ${exactTitle}`);
        
        // Now fetch the images using the exact title
        console.log(`Fetching images for: ${exactTitle}`);
        const response = await fetch(`/api/wikimedia/images?title=${encodeURIComponent(exactTitle)}`);
        
        if (!response.ok) {
          currentSearchIndex++;
          continue; // Try the next result
        }
        
        const result = await response.json();
        console.log('Image data:', result);
        
        // Check if the image is a small icon (to avoid)
        let shouldSkip = false;
        if (result.infoboxImage) {
          const lowerUrl = result.infoboxImage.toLowerCase();
          if (lowerUrl.includes('icon') || lowerUrl.includes('symbol') || 
              lowerUrl.includes('16px') || lowerUrl.includes('24px')) {
            console.log(`Skipping small icon image: ${result.infoboxImage}`);
            shouldSkip = true;
          }
        }
        
        if (result.infoboxImage && !shouldSkip) {
          setData(result);
          foundValidImage = true;
          break;
        }
        
        // Also fetch the raw HTML to try manual extraction
        const rawHtmlResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(exactTitle)}&prop=text&format=json&origin=*`);
        
        if (rawHtmlResponse.ok) {
          const rawHtmlData = await rawHtmlResponse.json();
          if (rawHtmlData.parse?.text?.['*']) {
            const html = rawHtmlData.parse.text['*'];
            setRawHtml(html);
            
            // Try to manually extract a valid image (not a small icon)
            const manualImage = extractImageFromHtml(html);
            if (manualImage) {
              const lowerUrl = manualImage.toLowerCase();
              if (!lowerUrl.includes('icon') && !lowerUrl.includes('symbol') && 
                  !lowerUrl.includes('16px') && !lowerUrl.includes('24px')) {
                // We found a suitable image through manual extraction
                const modifiedResult = {
                  ...result,
                  infoboxImage: manualImage,
                  note: 'Image extracted manually, avoiding small icons'
                };
                setData(modifiedResult);
                foundValidImage = true;
                break;
              }
            }
          }
        }
        
        // If we haven't found a valid image, try the next search result
        currentSearchIndex++;
      }
      
      // If we tried all options and still don't have data, use the last result anyway
      if (!foundValidImage && currentSearchIndex > 0) {
        // Fetch the last title we tried
        const response = await fetch(`/api/wikimedia/images?title=${encodeURIComponent(exactTitle)}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to manually extract image from HTML
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
        
        // Skip small icon images
        const lowerUrl = imageUrl.toLowerCase();
        if (lowerUrl.includes('icon') || lowerUrl.includes('symbol') || 
            lowerUrl.includes('16px') || lowerUrl.includes('24px')) {
          // Instead of continue, we'll just return null to skip this image
          return null;
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
      
      // Skip small icon images
      const lowerUrl = imageUrl.toLowerCase();
      if (lowerUrl.includes('icon') || lowerUrl.includes('symbol') || 
          lowerUrl.includes('16px') || lowerUrl.includes('24px')) {
        // Try to find a different image by looking at additional matches
        const allImageMatches = infoboxHtml.match(/<img[^>]*src="([^"]*)"[^>]*>/gi) || [];
        for (let i = 1; i < allImageMatches.length; i++) { // Start from the second match
          const nextMatch = allImageMatches[i].match(/src="([^"]*)"/i);
          if (nextMatch && nextMatch[1]) {
            let nextUrl = nextMatch[1];
            if (nextUrl.startsWith('//')) {
              nextUrl = `https:${nextUrl}`;
            }
            
            const nextLowerUrl = nextUrl.toLowerCase();
            if (!nextLowerUrl.includes('icon') && !nextLowerUrl.includes('symbol') && 
                !nextLowerUrl.includes('16px') && !nextLowerUrl.includes('24px')) {
              return nextUrl;
            }
          }
        }
      }
      
      return imageUrl;
    }
    
    return null;
  };
  
  const manualImageUrl = rawHtml ? extractImageFromHtml(rawHtml) : null;
  const isProbablyLogo = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.svg') || lowerUrl.endsWith('.png');
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-white flex items-center">
        <FiImage className="mr-3 text-accent" /> Wiki Image Extraction Test
      </h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center">
          <FiSearch className="mr-2 text-blue-400" /> Search Wikipedia for Images
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-grow">
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter Wikipedia page title"
            />
          </div>
          <button
            onClick={handleFetchImages}
            disabled={loading}
            className="flex items-center justify-center bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              <span className="flex items-center">
                <FiSearch className="mr-2" /> Fetch Images
              </span>
            )}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg mt-4 flex items-center">
            <FiAlertCircle className="mr-2 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}
      </div>
      
      {/* Search Results */}
      {searchResults && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
            <FiSearch className="mr-2 text-blue-400" /> Search Results
          </h2>
          <div className="space-y-4">
            {searchResults.query?.search?.map((result, index) => (
              <div key={index} className="border border-gray-700 bg-gray-900 p-4 rounded">
                <h3 className="font-medium text-blue-400">{result.title}</h3>
                <div 
                  className="text-gray-300 text-sm mt-2"
                  dangerouslySetInnerHTML={{ __html: result.snippet }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* API Response */}
      {data && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
            <FiCode className="mr-2 text-blue-400" /> API Response
          </h2>
          <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-60 text-sm text-gray-300 border border-gray-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Full Infobox */}
      {data?.infoboxHtml && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
            <FiBox className="mr-2 text-blue-400" /> Full Infobox
          </h2>
          <div 
            className="border border-gray-700 p-4 rounded overflow-auto max-h-[600px] bg-gray-900 wikipedia-infobox"
            dangerouslySetInnerHTML={{ __html: data.infoboxHtml }}
          />
          <style jsx global>{`
            .wikipedia-infobox th {
              background-color: #1f2937 !important;
              color: #d1d5db !important;
              padding: 4px 8px;
              text-align: left;
              font-weight: bold;
            }
            .wikipedia-infobox td {
              padding: 4px 8px;
              color: #d1d5db !important;
              background-color: #111827 !important;
            }
            .wikipedia-infobox a {
              color: #60a5fa !important;
              text-decoration: none;
            }
            .wikipedia-infobox img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            .wikipedia-infobox caption {
              font-weight: bold;
              padding: 8px;
              background-color: #1f2937 !important;
              color: #d1d5db !important;
            }
            .wikipedia-infobox tr {
              border-bottom: 1px solid #374151;
            }
            .wikipedia-infobox table {
              background-color: #111827 !important;
              border-color: #374151 !important;
            }
          `}</style>
        </div>
      )}
      
      {/* Extracted Image */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* API Extracted Image */}
        <div className="bg-gray-800 shadow-md rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center">
            <FiImage className="mr-2 text-blue-400" /> API Extracted Image
          </h2>
          {data?.infoboxImage ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full h-64 mb-4 border border-gray-700 rounded-lg overflow-hidden bg-gray-950">
                <Image
                  src={data.infoboxImage}
                  alt={`${pageTitle} cover`}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-full">
                <a 
                  href={data.infoboxImage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm flex items-center"
                >
                  <FiExternalLink className="mr-1" /> View Full Image
                </a>
                {isProbablyLogo(data.infoboxImage) && (
                  <p className="text-yellow-300 text-sm mt-2 flex items-center">
                    <FiInfo className="mr-1" /> This appears to be a logo/icon (SVG/PNG)
                  </p>
                )}
                {data.note && (
                  <p className="text-gray-400 text-sm mt-2">Note: {data.note}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-yellow-300 flex items-center">
              <FiInfo className="mr-2" /> No image extracted by API
            </div>
          )}
        </div>
        
        {/* Manually Extracted Image */}
        <div className="bg-gray-800 shadow-md rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center">
            <FiImage className="mr-2 text-blue-400" /> Manually Extracted Image
          </h2>
          {manualImageUrl ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full h-64 mb-4 border border-gray-700 rounded-lg overflow-hidden bg-gray-950">
                <Image
                  src={manualImageUrl}
                  alt={`${pageTitle} cover (manual)`}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-full">
                <a 
                  href={manualImageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm flex items-center"
                >
                  <FiExternalLink className="mr-1" /> View Full Image
                </a>
                {isProbablyLogo(manualImageUrl) && (
                  <p className="text-yellow-300 text-sm mt-2 flex items-center">
                    <FiInfo className="mr-1" /> This appears to be a logo/icon (SVG/PNG)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-yellow-300 flex items-center">
              <FiInfo className="mr-2" /> No image extracted manually
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 