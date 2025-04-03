'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function WikipediaTestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [availableImages, setAvailableImages] = useState([]);
  const [gameInfo, setGameInfo] = useState(null);
  const [error, setError] = useState(null);

  // Check for localStorage availability to cache results
  const hasLocalStorage = typeof window !== 'undefined';

  // Function to search Wikipedia for a game
  const searchWikipedia = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a game title to search');
      return;
    }

    setLoading(true);
    setSearchResults([]);
    setSelectedImage(null);
    setAvailableImages([]);
    setGameInfo(null);
    setError(null);

    try {
      // First check local storage cache
      const cacheKey = `wiki_search_${searchQuery.toLowerCase()}`;
      const cachedResults = hasLocalStorage ? localStorage.getItem(cacheKey) : null;

      if (cachedResults) {
        const parsed = JSON.parse(cachedResults);
        setSearchResults(parsed);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/wikipedia/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        
        // Cache the results
        if (hasLocalStorage) {
          localStorage.setItem(cacheKey, JSON.stringify(data.results));
        }
      } else {
        setError('No results found on Wikipedia');
      }
    } catch (error) {
      console.error('Wikipedia search error:', error);
      setError(`Search failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to get details about a Wikipedia page and its images
  const getPageDetails = async (title) => {
    setLoading(true);
    setSelectedImage(null);
    setAvailableImages([]);
    setGameInfo(null);
    setError(null);
    
    try {
      // First check local storage cache
      const cacheKey = `wiki_page_${title.toLowerCase().replace(/ /g, '_')}`;
      const cachedData = hasLocalStorage ? localStorage.getItem(cacheKey) : null;
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setGameInfo(parsed.page);
        setAvailableImages(parsed.images || []);
        if (parsed.images && parsed.images.length > 0) {
          const primary = parsed.images.find(img => img.isPrimary);
          setSelectedImage(primary || parsed.images[0]);
        }
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/wikipedia/images?title=${encodeURIComponent(title)}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.page) {
        setGameInfo(data.page);
        
        if (data.images && data.images.length > 0) {
          setAvailableImages(data.images);
          
          // Select primary image by default
          const primary = data.images.find(img => img.isPrimary);
          setSelectedImage(primary || data.images[0]);
        } else {
          setError('No images found for this game');
        }
        
        // Cache the results
        if (hasLocalStorage) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } else {
        setError('Could not retrieve page details');
      }
    } catch (error) {
      console.error('Wikipedia page error:', error);
      setError(`Failed to get page details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Direct cover image fetch for game title
  const fetchDirectCover = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a game title to search');
      return;
    }

    setLoading(true);
    setSearchResults([]);
    setSelectedImage(null);
    setAvailableImages([]);
    setGameInfo(null);
    setError(null);
    
    try {
      // Check cache first
      const cacheKey = `wiki_cover_${searchQuery.toLowerCase().replace(/ /g, '_')}`;
      const cachedData = hasLocalStorage ? localStorage.getItem(cacheKey) : null;
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setSelectedImage({
          url: parsed.coverUrl,
          title: parsed.title,
          isPrimary: true
        });
        setGameInfo({
          title: parsed.title,
          url: parsed.pageUrl,
          extract: parsed.extract || ''
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/wikipedia/cover?game=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.coverUrl) {
        setSelectedImage({
          url: data.coverUrl,
          title: data.title,
          isPrimary: true
        });
        setGameInfo({
          title: data.title,
          url: data.pageUrl,
          extract: data.extract || ''
        });
        
        // Cache the results
        if (hasLocalStorage) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } else {
        setError('No cover image found');
      }
    } catch (error) {
      console.error('Wikipedia cover error:', error);
      setError(`Failed to get cover: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press in search input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      searchWikipedia();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Wikipedia API Test</h1>
        <p className="text-gray-500 mb-6">Search for game information and cover images on Wikipedia</p>
        
        <div className="w-full max-w-lg">
          <div className="flex flex-col gap-4">
            <div className="mb-4">
              <label htmlFor="gameTitle" className="block text-sm font-medium mb-1">Game Title</label>
              <input
                id="gameTitle"
                type="text"
                placeholder="Enter game title e.g. Final Fantasy VII"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={searchWikipedia}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Games'}
              </button>
              
              <button
                onClick={fetchDirectCover}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
              >
                Direct Cover Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Results Panel */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            <div className="flex flex-col gap-3">
              {searchResults.map((result) => (
                <div
                  key={result.pageid}
                  className="p-3 border rounded hover:bg-gray-100 cursor-pointer transition-all"
                  onClick={() => getPageDetails(result.title)}
                >
                  <h3 className="font-medium">{result.title}</h3>
                  <p className="text-sm text-gray-500" 
                     dangerouslySetInnerHTML={{ __html: result.snippet }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Images Panel */}
        {availableImages.length > 0 && (
          <div className="border rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-4">Available Images</h2>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none mb-4"
              onChange={(e) => {
                const selected = availableImages.find(img => img.title === e.target.value);
                if (selected) setSelectedImage(selected);
              }}
            >
              <option value="">Select an image</option>
              {availableImages.map((image) => (
                <option key={image.title} value={image.title}>
                  {image.isPrimary ? `${image.title} (Primary)` : image.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Selected Image and Game Info */}
      {selectedImage && (
        <div className="mt-8">
          <div className="border rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4">Selected Cover Image</h2>
                <div className="relative border rounded-md overflow-hidden" 
                     style={{ height: 300, width: '100%', maxWidth: 400 }}>
                  <img 
                    src={selectedImage.url} 
                    alt={gameInfo?.title || 'Game cover'} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {selectedImage.isPrimary ? 'Primary thumbnail image' : selectedImage.title}
                </p>
              </div>
              
              {gameInfo && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Game Information</h2>
                  <h3 className="text-lg font-medium mb-2">{gameInfo.title}</h3>
                  <p className="mb-4 text-sm">{gameInfo.extract?.substring(0, 300)}...</p>
                  <a
                    href={gameInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                  >
                    View on Wikipedia
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex justify-center gap-4">
        <Link 
          href="/thegamesdb-test"
          className="inline-block bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-md"
        >
          TheGamesDB Test
        </Link>
        <Link 
          href="/screenscraper-test"
          className="inline-block bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-2 px-4 rounded-md"
        >
          ScreenScraper Test
        </Link>
      </div>
    </div>
  );
} 