'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiSearch, FiList, FiImage, FiInfo, FiAlertCircle, FiExternalLink, FiFilter, FiServer, FiX, FiMonitor, FiTag, FiMapPin, FiMaximize2 } from 'react-icons/fi';
import { HiOutlinePhotograph, HiOutlineDeviceMobile, HiOutlineExclamation, HiOutlineDatabase } from 'react-icons/hi';

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
        <h3 className="text-xl font-bold mb-4 text-white flex items-center border-b border-accent/30 pb-2">
          <HiOutlinePhotograph className="mr-2 text-accent" /> {displayTitle} ({filteredImages.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((img, index) => (
            <div key={index} className="border border-accent/30 rounded-lg p-4 bg-main shadow-md hover:border-accent/50 transition-all">
              <div className="relative h-48 mb-3 bg-black/30 rounded overflow-hidden">
                {!failedImages[index] ? (
                  <Image 
                    src={img.url} 
                    alt={`${img.type || 'Image'} ${index + 1}`}
                    fill
                    className="object-contain"
                    onError={() => handleImageError(index, img.url)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-red-400">
                    <HiOutlineExclamation className="mr-2 text-xl" /> Image failed to load
                  </div>
                )}
              </div>
              <div className="text-sm text-white/90 space-y-1">
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-24 inline-block"><FiTag className="inline mr-1" /> Type:</span> {img.type || 'Unknown'}</p>
                <p className="flex items-start">
                  <span className="font-semibold text-accent/80 w-24 inline-block pt-0.5"><FiExternalLink className="inline mr-1" /> URL:</span> 
                  <a 
                    href={img.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent/80 transition-colors block truncate"
                  >
                    {img.url}
                  </a>
                </p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-24 inline-block"><FiMapPin className="inline mr-1" /> Region:</span> {img.region || 'Unknown'}</p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-24 inline-block"><FiMaximize2 className="inline mr-1" /> Size:</span> {img.resolution || 'Unknown'}</p>
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-white flex items-center border-b border-accent/30 pb-4">
        <HiOutlineDatabase className="mr-3 text-accent text-4xl" /> ScreenScraper API Test
      </h1>
      
      <div className="mb-8 p-6 bg-muted rounded-lg shadow-md border border-accent/30 hover:border-accent/50 transition-all">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center border-b border-accent/30 pb-2">
          <FiSearch className="mr-2 text-accent" /> Search Parameters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1 flex items-center">
              <FiInfo className="mr-1 text-accent" /> Game Name
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="w-full p-3 border border-accent/30 rounded bg-main text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Enter game name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1 flex items-center">
              <HiOutlineDeviceMobile className="mr-1 text-accent" /> Platform
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  setDirectPlatformId(null); // Clear direct platform ID when changing dropdown
                }}
                className="w-full p-3 border border-accent/30 rounded bg-main text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
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
                  className="bg-red-600 text-white p-3 rounded hover:bg-red-700 flex items-center justify-center transition-colors"
                  title="Clear direct platform ID"
                >
                  <FiX />
                </button>
              )}
            </div>
            {directPlatformId !== null && (
              <div className="mt-1 text-xs text-yellow-400 flex items-center">
                <FiInfo className="mr-1" /> Using direct platform ID: {directPlatformId}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1 flex items-center">
              <FiFilter className="mr-1 text-accent" /> Image Type
            </label>
            <select
              value={selectedImageType}
              onChange={(e) => setSelectedImageType(e.target.value)}
              className="w-full p-3 border border-accent/30 rounded bg-main text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
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
            className="w-full bg-accent text-black font-medium py-3 px-4 rounded hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              <span className="flex items-center">
                <FiSearch className="mr-2" /> Search Game
              </span>
            )}
          </button>
          
          <button
            onClick={fetchFullPlatformList}
            disabled={loadingPlatforms}
            className="w-full bg-main border border-accent text-white py-3 px-4 rounded hover:bg-main hover:border-accent/80 disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            {loadingPlatforms ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading Platforms...
              </span>
            ) : (
              <span className="flex items-center">
                <FiList className="mr-2" /> Show Full Platform List
              </span>
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-900/20 text-red-300 rounded-lg border border-red-600/50 flex items-center animate-fadeIn">
          <HiOutlineExclamation className="mr-2 text-red-400 flex-shrink-0 text-2xl" />
          <span>{error}</span>
        </div>
      )}
      
      {fullPlatformList && (
        <div className="mb-8 bg-muted p-6 rounded-lg shadow-md border border-accent/30 hover:border-accent/50 transition-all animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center border-b border-accent/30 pb-2">
            <FiList className="mr-2 text-accent" /> Platform List ({filteredPlatforms.length} platforms)
          </h2>
          
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-white/50" />
              </div>
              <input
                type="text"
                placeholder="Search platforms..."
                className="w-full pl-10 p-3 border border-accent/30 rounded bg-main text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
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
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-main text-white border border-accent/30 rounded">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left border-b border-accent/20">ID</th>
                  <th className="px-4 py-2 text-left border-b border-accent/20">Platform ID</th>
                  <th className="px-4 py-2 text-left border-b border-accent/20">Name</th>
                  <th className="px-4 py-2 text-left border-b border-accent/20">Company</th>
                  <th className="px-4 py-2 text-left border-b border-accent/20">Type</th>
                  <th className="px-4 py-2 text-left border-b border-accent/20">Year</th>
                  <th className="px-4 py-2 text-left border-b border-accent/20">ROM Extensions</th>
                  <th className="px-4 py-2 text-left border-b border-accent/20">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlatforms.map((platform, index) => (
                  <tr key={platform.id || index} className={index % 2 === 0 ? 'bg-main' : 'bg-muted/50'}>
                    <td className="px-4 py-2 border-t border-accent/20">{platform.id}</td>
                    <td className="px-4 py-2 border-t border-accent/20">{platform.platformId}</td>
                    <td className="px-4 py-2 border-t border-accent/20">{platform.name}</td>
                    <td className="px-4 py-2 border-t border-accent/20">{platform.company}</td>
                    <td className="px-4 py-2 border-t border-accent/20">{platform.type}</td>
                    <td className="px-4 py-2 border-t border-accent/20">{platform.year}</td>
                    <td className="px-4 py-2 border-t border-accent/20">{platform.extensions}</td>
                    <td className="px-4 py-2 border-t border-accent/20">
                      <button
                        onClick={() => handleUseThisPlatform(platform.platformId)}
                        className="bg-accent text-black font-medium py-1 px-2 text-xs rounded hover:bg-accent/90 transition-colors"
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
        <div className="mb-8 bg-muted p-6 rounded-lg shadow-md border border-accent/30 hover:border-accent/50 transition-all animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center border-b border-accent/30 pb-2">
            <FiServer className="mr-2 text-accent" /> Raw API Response
          </h2>
          <pre className="bg-main p-4 rounded overflow-auto max-h-96 text-sm text-white/90 border border-accent/30">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      )}
      
      {data && data.gameData && (
        <div className="space-y-8">
          {data.gameData.warning && (
            <div className="bg-yellow-900/20 text-yellow-300 p-4 rounded-lg border border-yellow-600/50 flex items-start animate-fadeIn">
              <HiOutlineExclamation className="mr-2 text-yellow-400 flex-shrink-0 mt-1 text-2xl" />
              <div>
                <strong className="font-bold">Warning:</strong> {data.gameData.warning}
              </div>
            </div>
          )}
          
          <div className="bg-muted p-6 rounded-lg shadow-md border border-accent/30 hover:border-accent/50 transition-all animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center border-b border-accent/30 pb-2">
              <FiInfo className="mr-2 text-accent" /> Game Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">Name:</span> {data.gameData.name}</p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">ID:</span> {data.gameData.id}</p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">System:</span> {data.gameData.system}</p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">Region:</span> {data.gameData.region}</p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">Publisher:</span> {data.gameData.publisher}</p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">Developer:</span> {data.gameData.developer}</p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">Players:</span> {data.gameData.players}</p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">Rating:</span> {data.gameData.rating}</p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">Release Date:</span> {data.gameData.releaseDate}</p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">Genre:</span> {data.gameData.genre}</p>
                <p className="flex items-center"><span className="font-semibold text-accent/80 w-28 inline-block">Perspective:</span> {data.gameData.perspective}</p>
                <div className="flex items-start">
                  <span className="font-semibold text-accent/80 w-28 inline-block mt-1">Description:</span> 
                  <p className="text-white/90">{data.gameData.description}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Display direct URLs for box art, title screen, and screenshots */}
          <div className="bg-muted p-6 rounded-lg shadow-md border border-accent/30 hover:border-accent/50 transition-all animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center border-b border-accent/30 pb-2">
              <FiImage className="mr-2 text-accent" /> Quick Image Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.gameData.boxUrl && (
                <div className="bg-main p-4 rounded-lg border border-accent/30 hover:border-accent/50 transition-all">
                  <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <FiImage className="mr-2 text-accent" /> Box Art
                  </h3>
                  <div className="relative h-48 mb-3 border border-accent/20 rounded overflow-hidden bg-black/30">
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
                    <div className="hidden items-center justify-center h-full text-red-400 bg-main/50">
                      <HiOutlineExclamation className="mr-2 text-xl" /> Image failed to load
                    </div>
                  </div>
                  <a 
                    href={data.gameData.boxUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent/80 transition-colors text-sm block truncate flex items-center"
                  >
                    <FiExternalLink className="mr-1 flex-shrink-0" /> View Full Size
                  </a>
                </div>
              )}
              
              {data.gameData.titleUrl && (
                <div className="bg-main p-4 rounded-lg border border-accent/30 hover:border-accent/50 transition-all">
                  <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <FiImage className="mr-2 text-accent" /> Title Screen
                  </h3>
                  <div className="relative h-48 mb-3 border border-accent/20 rounded overflow-hidden bg-black/30">
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
                    <div className="hidden items-center justify-center h-full text-red-400 bg-main/50">
                      <HiOutlineExclamation className="mr-2 text-xl" /> Image failed to load
                    </div>
                  </div>
                  <a 
                    href={data.gameData.titleUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent/80 transition-colors text-sm block truncate flex items-center"
                  >
                    <FiExternalLink className="mr-1 flex-shrink-0" /> View Full Size
                  </a>
                </div>
              )}
              
              {data.gameData.screenshotUrl && (
                <div className="bg-main p-4 rounded-lg border border-accent/30 hover:border-accent/50 transition-all">
                  <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <FiImage className="mr-2 text-accent" /> Screenshot
                  </h3>
                  <div className="relative h-48 mb-3 border border-accent/20 rounded overflow-hidden bg-black/30">
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
                    <div className="hidden items-center justify-center h-full text-red-400 bg-main/50">
                      <HiOutlineExclamation className="mr-2 text-xl" /> Image failed to load
                    </div>
                  </div>
                  <a 
                    href={data.gameData.screenshotUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent/80 transition-colors text-sm block truncate flex items-center"
                  >
                    <FiExternalLink className="mr-1 flex-shrink-0" /> View Full Size
                  </a>
                </div>
              )}
            </div>
          </div>
                    
          {/* Image sections */}
          {renderImageSection('All Game Images', data.gameData.images)}
          
        </div>
      )}
    </div>
  );
} 