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
  const [fullPlatformList, setFullPlatformList] = useState(null);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [filteredPlatforms, setFilteredPlatforms] = useState(null);
  const [directPlatformId, setDirectPlatformId] = useState(null);

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

  // Function to fetch the full platform list from ScreenScraper API
  const fetchFullPlatformList = async () => {
    setLoadingPlatforms(true);
    setError(null);
    
    try {
      const response = await fetch('/api/screenscraper/platforms?fromApi=true');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch platform list');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch platform data');
      }
      
      console.log('Platform API Response:', data);
      setFullPlatformList(data.platforms);
      setFilteredPlatforms(data.platforms); // Initialize filtered platforms with all platforms
    } catch (err) {
      setError('Error fetching platform list: ' + err.message);
      console.error('Platform list error:', err);
    } finally {
      setLoadingPlatforms(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setRawResponse(null);
    setFailedImages({});

    try {
      // Construct API URL based on whether we have a direct platform ID or need to use the core ID
      let apiUrl = `/api/screenscraper?name=${encodeURIComponent(gameName)}&strict=true`;
      
      if (directPlatformId) {
        apiUrl += `&platformId=${directPlatformId}`;
        console.log(`Searching using direct platform ID: ${directPlatformId}`);
      } else {
        apiUrl += `&core=${platform}`;
        console.log(`Searching using platform core: ${platform}`);
      }
      
      // First, get the raw response from the ScreenScraper API
      const rawResponse = await fetch(apiUrl);
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
    
    // Get the proper title based on the selected image type
    const selectedType = imageTypes.find(type => type.id === selectedImageType);
    const displayTitle = selectedImageType === 'all' ? title : selectedType?.label || title;
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-white">{displayTitle}</h3>
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

  const handleUseThisPlatform = (platformId) => {
    // Find the closest matching platform in our dropdown list
    const matchingPlatform = platforms.find(p => p.platformId === platformId);
    
    if (matchingPlatform) {
      setPlatform(matchingPlatform.id);
    } else {
      // If no matching platform in our dropdown, create a temporary one
      const tempPlatforms = [...platforms];
      const newPlatform = {
        id: `id_${platformId}`,
        name: `Custom Platform (ID: ${platformId})`,
        platformId: platformId
      };
      
      tempPlatforms.push(newPlatform);
      setPlatforms(tempPlatforms);
      setPlatform(newPlatform.id);
    }
    
    // Set the platform ID for direct search
    setDirectPlatformId(platformId);
    
    // Scroll back to the search form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
            <div className="flex items-center space-x-2">
              <select
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  setDirectPlatformId(null); // Clear direct platform ID when changing dropdown
                }}
                className="w-full p-2 border border-gray-700 rounded bg-gray-700 text-white"
                disabled={directPlatformId !== null}
              >
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ID: {p.platformId})
                  </option>
                ))}
              </select>
              {directPlatformId !== null && (
                <button
                  onClick={() => setDirectPlatformId(null)}
                  className="bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700"
                  title="Clear direct platform ID"
                >
                  ✕
                </button>
              )}
            </div>
            {directPlatformId !== null && (
              <div className="mt-1 text-xs text-yellow-400">
                Using direct platform ID: {directPlatformId}
              </div>
            )}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Searching...' : 'Search Game'}
          </button>
          
          <button
            onClick={fetchFullPlatformList}
            disabled={loadingPlatforms}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-green-300"
          >
            {loadingPlatforms ? 'Loading Platforms...' : 'Show Full Platform List'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-700">
          {error}
        </div>
      )}
      
      {fullPlatformList && (
        <div className="mb-8 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Platform List from ScreenScraper ({filteredPlatforms.length} platforms)
          </h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search platforms..."
              className="w-full p-2 border border-gray-700 rounded bg-gray-700 text-white"
              onChange={(e) => {
                const filter = e.target.value.toLowerCase();
                const filtered = fullPlatformList.filter(p => 
                  p.name.toLowerCase().includes(filter) || 
                  p.id.toLowerCase().includes(filter) ||
                  String(p.platformId).includes(filter)
                );
                setFilteredPlatforms(filtered);
              }}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 text-gray-200 border border-gray-700 rounded">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Platform ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Company</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Year</th>
                  <th className="px-4 py-2 text-left">ROM Extensions</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlatforms.map((platform, index) => (
                  <tr key={platform.id || index} className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                    <td className="px-4 py-2 border-t border-gray-700">{platform.id}</td>
                    <td className="px-4 py-2 border-t border-gray-700">{platform.platformId}</td>
                    <td className="px-4 py-2 border-t border-gray-700">{platform.name}</td>
                    <td className="px-4 py-2 border-t border-gray-700">{platform.company}</td>
                    <td className="px-4 py-2 border-t border-gray-700">{platform.type}</td>
                    <td className="px-4 py-2 border-t border-gray-700">{platform.year}</td>
                    <td className="px-4 py-2 border-t border-gray-700">{platform.extensions}</td>
                    <td className="px-4 py-2 border-t border-gray-700">
                      <button
                        onClick={() => handleUseThisPlatform(platform.platformId)}
                        className="bg-blue-600 text-white py-1 px-2 text-xs rounded hover:bg-blue-700"
                      >
                        Use This
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              {selectedImageType === 'all' ? (
                <h2 className="text-2xl font-bold mb-4 text-white">Images ({data.gameData.images.length} found)</h2>
              ) : (
                <h2 className="text-2xl font-bold mb-4 text-white">
                  {imageTypes.find(type => type.id === selectedImageType)?.label || 'Images'} (
                    {data.gameData.images.filter(img => 
                      (img.type || '').toLowerCase().includes(selectedImageType)
                    ).length} found)
                </h2>
              )}
              {renderImageSection(
                selectedImageType === 'all' ? 'All Images' : imageTypes.find(type => type.id === selectedImageType)?.label, 
                data.gameData.images
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 