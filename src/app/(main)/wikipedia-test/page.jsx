'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card, Select, SelectItem, Spinner, Divider } from '@nextui-org/react';
import { IconSearch, IconBrandWikipedia, IconPhotoSearch } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function WikipediaTestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [availableImages, setAvailableImages] = useState([]);
  const [gameInfo, setGameInfo] = useState(null);

  // Check for localStorage availability to cache results
  const hasLocalStorage = typeof localStorage !== 'undefined';

  // Function to search Wikipedia for a game
  const searchWikipedia = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a game title to search');
      return;
    }

    setLoading(true);
    setSearchResults([]);
    setSelectedImage(null);
    setAvailableImages([]);
    setGameInfo(null);

    try {
      // First check local storage cache
      const cacheKey = `wiki_search_${searchQuery.toLowerCase()}`;
      const cachedResults = hasLocalStorage ? localStorage.getItem(cacheKey) : null;

      if (cachedResults) {
        const parsed = JSON.parse(cachedResults);
        setSearchResults(parsed);
        toast.success('Found cached search results');
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
        
        toast.success(`Found ${data.results.length} results`);
      } else {
        toast.error('No results found on Wikipedia');
      }
    } catch (error) {
      console.error('Wikipedia search error:', error);
      toast.error(`Search failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to get details about a Wikipedia page and its images
  const getPageDetails = async (title) => {
    setLoading(true);
    setGameTitle(title);
    setSelectedImage(null);
    setAvailableImages([]);
    setGameInfo(null);
    
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
        toast.success('Loaded cached page data');
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
          
          toast.success(`Found ${data.images.length} images`);
        } else {
          toast.error('No images found for this game');
        }
        
        // Cache the results
        if (hasLocalStorage) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } else {
        toast.error('Could not retrieve page details');
      }
    } catch (error) {
      console.error('Wikipedia page error:', error);
      toast.error(`Failed to get page details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Direct cover image fetch for game title
  const fetchDirectCover = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a game title to search');
      return;
    }

    setLoading(true);
    setSearchResults([]);
    setSelectedImage(null);
    setAvailableImages([]);
    setGameInfo(null);
    
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
        toast.success('Loaded cached cover image');
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
        
        toast.success('Found cover image');
      } else {
        toast.error('No cover image found');
      }
    } catch (error) {
      console.error('Wikipedia cover error:', error);
      toast.error(`Failed to get cover: ${error.message}`);
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
            <Input
              label="Game Title"
              placeholder="Enter game title e.g. Final Fantasy VII"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              startContent={<IconSearch className="text-gray-400" />}
              className="mb-2"
            />
            
            <div className="flex gap-2">
              <Button
                color="primary"
                startContent={<IconSearch />}
                isLoading={loading}
                onClick={searchWikipedia}
                className="flex-1"
              >
                Search Games
              </Button>
              
              <Button
                color="secondary"
                startContent={<IconPhotoSearch />}
                isLoading={loading}
                onClick={fetchDirectCover}
              >
                Direct Cover Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center my-8">
          <Spinner size="lg" color="secondary" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Results Panel */}
        {searchResults.length > 0 && (
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            <div className="flex flex-col gap-3">
              {searchResults.map((result) => (
                <motion.div
                  key={result.pageid}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => getPageDetails(result.title)}
                >
                  <h3 className="font-medium">{result.title}</h3>
                  <p className="text-sm text-gray-500" 
                     dangerouslySetInnerHTML={{ __html: result.snippet }} />
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* Images Panel */}
        {availableImages.length > 0 && (
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Available Images</h2>
            <Select
              label="Select an image"
              placeholder="Choose an image"
              className="mb-4"
              onChange={(e) => {
                const selected = availableImages.find(img => img.title === e.target.value);
                if (selected) setSelectedImage(selected);
              }}
            >
              {availableImages.map((image) => (
                <SelectItem key={image.title} value={image.title}>
                  {image.isPrimary ? `${image.title} (Primary)` : image.title}
                </SelectItem>
              ))}
            </Select>
          </Card>
        )}
      </div>

      {/* Selected Image and Game Info */}
      {selectedImage && (
        <div className="mt-8">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4">Selected Cover Image</h2>
                <div className="relative border dark:border-gray-700 rounded-md overflow-hidden" 
                     style={{ height: 300, width: '100%', maxWidth: 400 }}>
                  <img 
                    src={selectedImage.url} 
                    alt={gameInfo?.title || 'Game cover'} 
                    className="absolute inset-0 w-full h-full object-contain"
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
                  <Button
                    as={Link}
                    href={gameInfo.url}
                    target="_blank"
                    color="primary"
                    variant="flat"
                    startContent={<IconBrandWikipedia />}
                  >
                    View on Wikipedia
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex justify-center gap-4">
        <Button as={Link} href="/thegamesdb-test" variant="flat" color="primary">
          TheGamesDB Test
        </Button>
        <Button as={Link} href="/screenscraper-test" variant="flat" color="secondary">
          ScreenScraper Test
        </Button>
      </div>
    </div>
  );
} 