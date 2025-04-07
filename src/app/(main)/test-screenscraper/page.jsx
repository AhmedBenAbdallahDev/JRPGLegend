'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function TestScreenScraperPage() {
  const [gameName, setGameName] = useState('Super Mario Bros');
  const [platform, setPlatform] = useState('nes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [selectedImageType, setSelectedImageType] = useState('all');
  const [rawResponse, setRawResponse] = useState(null);
  const [failedImages, setFailedImages] = useState({});

  // Fetch platforms on component mount
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await fetch('/api/screenscraper/platforms');
        const data = await response.json();
        if (data.success) {
          setPlatforms(data.platforms);
          // Set initial platform to NES
          const nes = data.platforms.find(p => p.id === 'nes');
          if (nes) {
            setPlatform(nes.id);
          }
        } else {
          setError(data.error || 'Failed to fetch platforms');
        }
      } catch (err) {
        setError('Error fetching platforms: ' + err.message);
      }
    };

    fetchPlatforms();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setRawResponse(null);
    setFailedImages({});

    try {
      // First, get the raw response from the ScreenScraper API
      const rawResponse = await fetch(`/api/screenscraper?name=${encodeURIComponent(gameName)}&core=${platform}&strict=true`);
      const rawData = await rawResponse.json();
      
      if (!rawResponse.ok) {
        throw new Error(rawData.error || 'Failed to fetch from ScreenScraper API');
      }
      
      if (!rawData.success) {
        throw new Error(rawData.error || 'Failed to fetch game data');
      }
      
      console.log('API Response:', rawData);
      setRawResponse(rawData);
      setData(rawData); // The raw response already contains the processed game data
    } catch (err) {
      setError('Error: ' + err.message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Focus on the most important image types for the user's needs
  const imageTypes = [
    { id: 'all', label: 'All Images' },
    { id: 'box', label: 'Box Art' },
    { id: 'title', label: 'Title Screen' },
    { id: 'ss', label: 'Screenshot' },
    { id: 'fanart', label: 'Fan Art' },
    { id: 'mix', label: 'Mix' },
    { id: 'flyer', label: 'Flyer' },
    { id: 'support', label: 'Support' },
    { id: 'maps', label: 'Maps' },
    { id: 'videos', label: 'Videos' },
    { id: 'wheels', label: 'Wheels' },
    { id: 'marquees', label: 'Marquees' }
  ];

  const handleImageError = (index, url) => {
    console.error(`Failed to load image at index ${index}: ${url}`);
    setFailedImages(prev => ({
      ...prev,
      [index]: true
    }));
  };

  const renderImageSection = (title, images) => {
    if (!images || images.length === 0) return null;
    
    const filteredImages = selectedImageType === 'all' 
      ? images 
      : images.filter(img => (img.type || '').toLowerCase().includes(selectedImageType));
    
    if (filteredImages.length === 0) return null;
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((img, index) => (
            <div key={index} className="border border-gray-700 rounded-lg p-4 bg-gray-800 shadow-sm">
              <div className="relative h-48 mb-2">
                {!failedImages[index] ? (
                  <Image 
                    src={img.url} 
                    alt={`${img.type || 'Image'} ${index + 1}`}
                    fill
                    className="object-contain"
                    onError={() => handleImageError(index, img.url)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-red-500">
                    Image failed to load
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-200">
                <p><strong>Type:</strong> {img.type || 'Unknown'}</p>
                <p><strong>URL:</strong> <a 
                  href={img.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline block truncate"
                >
                  {img.url}
                </a></p>
                <p><strong>Region:</strong> {img.region || 'Unknown'}</p>
                <p><strong>Resolution:</strong> {img.resolution || 'Unknown'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">ScreenScraper API Test</h1>
      
      <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-md border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Game Name
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="w-full p-2 border border-gray-700 rounded bg-gray-700 text-white"
              placeholder="Enter game name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-2 border border-gray-700 rounded bg-gray-700 text-white"
            >
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (ID: {p.platformId})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Image Type
            </label>
            <select
              value={selectedImageType}
              onChange={(e) => setSelectedImageType(e.target.value)}
              className="w-full p-2 border border-gray-700 rounded bg-gray-700 text-white"
            >
              {imageTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Searching...' : 'Search Game'}
        </button>
      </div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-700">
          {error}
        </div>
      )}
      
      {rawResponse && (
        <div className="mb-8 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-white">Raw API Response</h2>
          <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-96 text-sm text-gray-300 border border-gray-700">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      )}
      
      {data && data.gameData && (
        <div className="space-y-8">
          {data.gameData.warning && (
            <div className="bg-yellow-800 text-yellow-200 p-4 rounded-lg border border-yellow-600">
              <strong>Warning:</strong> {data.gameData.warning}
            </div>
          )}
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">Game Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-200">
              <div>
                <p><strong>Name:</strong> {data.gameData.name}</p>
                <p><strong>ID:</strong> {data.gameData.id}</p>
                <p><strong>System:</strong> {data.gameData.system}</p>
                <p><strong>Region:</strong> {data.gameData.region}</p>
                <p><strong>Publisher:</strong> {data.gameData.publisher}</p>
                <p><strong>Developer:</strong> {data.gameData.developer}</p>
                <p><strong>Players:</strong> {data.gameData.players}</p>
                <p><strong>Rating:</strong> {data.gameData.rating}</p>
                <p><strong>Release Date:</strong> {data.gameData.releaseDate}</p>
              </div>
              <div>
                <p><strong>Genre:</strong> {data.gameData.genre}</p>
                <p><strong>Perspective:</strong> {data.gameData.perspective}</p>
                <p><strong>Description:</strong> {data.gameData.description}</p>
              </div>
            </div>
          </div>
          
          {/* Display direct URLs for box art, title screen, and screenshots */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">Quick Image Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.gameData.boxUrl && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Box Art</h3>
                  <div className="relative h-48 mb-2 border border-gray-700">
                    <Image 
                      src={data.gameData.boxUrl} 
                      alt="Box Art"
                      fill
                      className="object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center h-full text-red-500 bg-gray-800">
                      Image failed to load
                    </div>
                  </div>
                  <a 
                    href={data.gameData.boxUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm block truncate"
                  >
                    {data.gameData.boxUrl}
                  </a>
                </div>
              )}
              
              {data.gameData.titleUrl && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Title Screen</h3>
                  <div className="relative h-48 mb-2 border border-gray-700">
                    <Image 
                      src={data.gameData.titleUrl} 
                      alt="Title Screen"
                      fill
                      className="object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center h-full text-red-500 bg-gray-800">
                      Image failed to load
                    </div>
                  </div>
                  <a 
                    href={data.gameData.titleUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm block truncate"
                  >
                    {data.gameData.titleUrl}
                  </a>
                </div>
              )}
              
              {data.gameData.screenshotUrl && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Screenshot</h3>
                  <div className="relative h-48 mb-2 border border-gray-700">
                    <Image 
                      src={data.gameData.screenshotUrl} 
                      alt="Screenshot"
                      fill
                      className="object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center h-full text-red-500 bg-gray-800">
                      Image failed to load
                    </div>
                  </div>
                  <a 
                    href={data.gameData.screenshotUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm block truncate"
                  >
                    {data.gameData.screenshotUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Display all images from the API response */}
          {data.gameData.images && data.gameData.images.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-white">Images ({data.gameData.images.length} found)</h2>
              {renderImageSection('All Images', data.gameData.images)}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 