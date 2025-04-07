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

    try {
      // First, get the raw response from the ScreenScraper API
      const rawResponse = await fetch(`/api/screenscraper?name=${encodeURIComponent(gameName)}&core=${platform}`);
      const rawData = await rawResponse.json();
      
      if (!rawResponse.ok) {
        throw new Error(rawData.error || 'Failed to fetch from ScreenScraper API');
      }
      
      if (!rawData.success) {
        throw new Error(rawData.error || 'Failed to fetch game data');
      }
      
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
    { id: 'cover', label: 'Cover Images' },
    { id: 'texture', label: 'Texture Files' },
    { id: 'box2d', label: 'Box 2D' },
    { id: 'cartridge', label: 'Cartridge' },
    { id: 'screenshot', label: 'Screenshots' },
    { id: 'fanart', label: 'Fan Art' },
    { id: 'banner', label: 'Banners' },
    { id: 'logo', label: 'Logos' },
    { id: 'marquee', label: 'Marquees' },
    { id: 'wheel', label: 'Wheels' },
    { id: 'video', label: 'Videos' },
    { id: 'box3d', label: 'Box 3D' },
    { id: 'media', label: 'Media' }
  ];

  const filterImages = (images) => {
    if (!images) return [];
    if (selectedImageType === 'all') return images;
    
    return images.filter(img => {
      const type = img.type?.toLowerCase() || '';
      return type.includes(selectedImageType);
    });
  };

  const renderImageSection = (title, images, type) => {
    if (!images || images.length === 0) return null;
    
    const filteredImages = filterImages(images);
    if (filteredImages.length === 0) return null;
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((img, index) => (
            <div key={index} className="border border-gray-700 rounded-lg p-4 bg-gray-800 shadow-sm">
              <div className="relative h-48 mb-2">
                <Image 
                  src={img.url} 
                  alt={`${img.type || 'Image'} ${index + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-sm text-gray-200">
                <p><strong>Type:</strong> {img.type || 'Unknown'}</p>
                <p><strong>Region:</strong> {img.region || 'Unknown'}</p>
                <p><strong>Resolution:</strong> {img.resolution || 'Unknown'}</p>
                {img.crc && <p><strong>CRC:</strong> {img.crc}</p>}
                {img.md5 && <p><strong>MD5:</strong> {img.md5}</p>}
                {img.sha1 && <p><strong>SHA1:</strong> {img.sha1}</p>}
                <a 
                  href={img.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline block mt-2"
                >
                  View Full Size
                </a>
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
          <h2 className="text-2xl font-bold mb-4 text-white">Raw ScreenScraper API Response</h2>
          <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-96 text-sm text-gray-300 border border-gray-700">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      )}
      
      {data && (
        <div className="space-y-8">
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
          
          {/* Display all images from the API response */}
          {data.gameData && data.gameData.images && data.gameData.images.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-white">All Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterImages(data.gameData.images).map((img, index) => (
                  <div key={index} className="border border-gray-700 rounded-lg p-4 bg-gray-800 shadow-sm">
                    <div className="relative h-48 mb-2">
                      <Image 
                        src={img.url} 
                        alt={`${img.type || 'Image'} ${index + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="text-sm text-gray-200">
                      <p><strong>Type:</strong> {img.type || 'Unknown'}</p>
                      <p><strong>Region:</strong> {img.region || 'Unknown'}</p>
                      <p><strong>Resolution:</strong> {img.resolution || 'Unknown'}</p>
                      {img.crc && <p><strong>CRC:</strong> {img.crc}</p>}
                      {img.md5 && <p><strong>MD5:</strong> {img.md5}</p>}
                      {img.sha1 && <p><strong>SHA1:</strong> {img.sha1}</p>}
                      <a 
                        href={img.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline block mt-2"
                      >
                        View Full Size
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Prioritize the most important image types */}
          {data.gameData && data.gameData.images && data.gameData.images.length > 0 && (
            <>
              {renderImageSection('Cover Images', data.gameData.images, 'cover')}
              {renderImageSection('Texture Files', data.gameData.images, 'texture')}
              {renderImageSection('Box 2D', data.gameData.images, 'box2d')}
              {renderImageSection('Cartridge', data.gameData.images, 'cartridge')}
              {renderImageSection('Screenshots', data.gameData.images, 'screenshot')}
              {renderImageSection('Fan Art', data.gameData.images, 'fanart')}
              {renderImageSection('Banners', data.gameData.images, 'banner')}
              {renderImageSection('Logos', data.gameData.images, 'logo')}
              {renderImageSection('Marquees', data.gameData.images, 'marquee')}
              {renderImageSection('Wheels', data.gameData.images, 'wheel')}
              {renderImageSection('Videos', data.gameData.images, 'video')}
              {renderImageSection('Box 3D', data.gameData.images, 'box3d')}
              {renderImageSection('Media', data.gameData.images, 'media')}
            </>
          )}
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">Processed API Response</h2>
            <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-96 text-sm text-gray-300 border border-gray-700">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 