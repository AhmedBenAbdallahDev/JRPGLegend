'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiImage, FiSearch, FiInfo, FiCamera, FiGrid, FiFileText } from 'react-icons/fi';

export default function TestWikiImagesPage() {
  const [pageTitle, setPageTitle] = useState('');
  const [images, setImages] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchImages = async () => {
    if (!pageTitle.trim()) return;
    
    setLoading(true);
    setError(null);
    setImages(null);
    
    try {
      console.log(`[TestWikiImagesPage] Fetching images for: "${pageTitle}"`);
      const response = await fetch(`/api/wikimedia/images?title=${encodeURIComponent(pageTitle.trim())}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.info || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[TestWikiImagesPage] Received image data:', data);
      
      setImages(data);
    } catch (err) {
      console.error('[TestWikiImagesPage] Error fetching images:', err);
      setError(err.message || 'An error occurred while fetching images');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-white flex items-center">
        <FiImage className="mr-3 text-accent" /> Wikimedia Images Test
      </h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
        <p className="mb-4 text-gray-300">
          Enter a Wikipedia page title to fetch images from that page. This is useful for getting game cover images and other media.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Enter Wikipedia page title (e.g., 'The Legend of Zelda')"
              className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            onClick={handleFetchImages}
            disabled={loading || !pageTitle.trim()}
            className="flex items-center justify-center bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading Images...
              </span>
            ) : (
              <span className="flex items-center">
                <FiSearch className="mr-2" /> Fetch Images
              </span>
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-2 text-white flex items-center">
            <FiInfo className="mr-2 text-red-400" /> Error
          </h2>
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      {images && (
        <div className="space-y-8">
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
            <div className="p-4 border-b border-gray-700 bg-gray-900/50">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FiFileText className="mr-2 text-blue-400" /> {images.title}
              </h2>
            </div>
            
            {/* Thumbnail Image */}
            {images.thumbnail && (
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium mb-3 text-gray-200 flex items-center">
                  <FiCamera className="mr-2 text-blue-400" /> Thumbnail Image
                </h3>
                <div className="relative h-64 w-full bg-gray-900 rounded-lg overflow-hidden">
                  <Image 
                    src={images.thumbnail}
                    alt={`${images.title} thumbnail`}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            
            {/* Infobox Image */}
            {images.infoboxImage && (
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium mb-3 text-gray-200 flex items-center">
                  <FiCamera className="mr-2 text-blue-400" /> Infobox Image
                </h3>
                <div className="relative h-64 w-full bg-gray-900 rounded-lg overflow-hidden">
                  <Image 
                    src={images.infoboxImage}
                    alt={`${images.title} infobox image`}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            
            {/* Additional Images */}
            {images.images && images.images.length > 0 && (
              <div className="p-4">
                <h3 className="text-lg font-medium mb-3 text-gray-200 flex items-center">
                  <FiGrid className="mr-2 text-blue-400" /> Additional Images ({images.images.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {images.images.map((img, index) => (
                    <div key={index} className="border border-gray-700 rounded overflow-hidden bg-gray-900">
                      <div className="relative h-48 w-full">
                        <Image 
                          src={img.url}
                          alt={img.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="p-2 bg-gray-800 text-xs">
                        <p className="truncate text-gray-300" title={img.title}>{img.title}</p>
                        <p className="text-gray-500">{img.width} × {img.height}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Image IDs */}
            {images.imageIds && (
              <div className="p-4 bg-gray-900/50 text-sm">
                <h3 className="font-medium mb-1 text-gray-300 flex items-center">
                  <FiInfo className="mr-2 text-blue-400" /> Image IDs
                </h3>
                <p className="text-gray-400 break-words overflow-auto p-2 bg-gray-950 rounded">{images.imageIds}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 