'use client';

import { useState } from 'react';
import Image from 'next/image';

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
      
      // Get the exact title from the first search result
      const exactTitle = searchData.query.search[0].title;
      console.log(`Using exact title: ${exactTitle}`);
      
      // Now fetch the images using the exact title
      console.log(`Fetching images for: ${exactTitle}`);
      const response = await fetch(`/api/wikimedia/images?title=${encodeURIComponent(exactTitle)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.info || 'Failed to fetch images');
      }
      
      const result = await response.json();
      console.log('Image data:', result);
      setData(result);
      
      // Also fetch the raw HTML to debug
      const rawHtmlResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(exactTitle)}&prop=text&format=json&origin=*`);
      
      if (rawHtmlResponse.ok) {
        const rawHtmlData = await rawHtmlResponse.json();
        if (rawHtmlData.parse?.text?.['*']) {
          setRawHtml(rawHtmlData.parse.text['*']);
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
  
  const manualImageUrl = rawHtml ? extractImageFromHtml(rawHtml) : null;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Wiki Image Extraction Test</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded"
            placeholder="Enter Wikipedia page title"
          />
          <button
            onClick={handleFetchImages}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch Images'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
      </div>
      
      {/* Search Results */}
      {searchResults && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <div className="space-y-4">
            {searchResults.query?.search?.map((result, index) => (
              <div key={index} className="border border-gray-200 p-4 rounded">
                <h3 className="font-medium">{result.title}</h3>
                <p className="text-sm text-gray-600">{result.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* API Response */}
      {data && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">API Response</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Full Infobox */}
      {data?.infoboxHtml && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Full Infobox</h2>
          <div 
            className="border border-gray-300 p-4 rounded overflow-auto max-h-[600px]"
            dangerouslySetInnerHTML={{ __html: data.infoboxHtml }}
          />
        </div>
      )}
      
      {/* Extracted Image */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* API Extracted Image */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API Extracted Image</h2>
          {data?.infoboxImage ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md h-64 mb-4">
                <Image
                  src={data.infoboxImage}
                  alt={`${pageTitle} cover`}
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded"
                />
              </div>
              <p className="text-sm text-gray-600 break-all">{data.infoboxImage}</p>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-100 rounded">
              <p className="text-gray-500">No image found in the infobox</p>
            </div>
          )}
        </div>
        
        {/* Manual Extracted Image */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Extracted Image</h2>
          {manualImageUrl ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md h-64 mb-4">
                <Image
                  src={manualImageUrl}
                  alt={`${pageTitle} cover (manual)`}
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded"
                />
              </div>
              <p className="text-sm text-gray-600 break-all">{manualImageUrl}</p>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-100 rounded">
              <p className="text-gray-500">No image found manually</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Raw HTML (for debugging) */}
      {rawHtml && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Raw HTML (first 1000 chars)</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-sm">
            {rawHtml.substring(0, 1000)}...
          </pre>
        </div>
      )}
    </div>
  );
} 