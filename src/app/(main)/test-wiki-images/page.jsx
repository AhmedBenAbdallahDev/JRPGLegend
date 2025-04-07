'use client';

import { useState } from 'react';
import Image from 'next/image';

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Wikimedia Images Test</h1>
      
      <div className="mb-6">
        <p className="mb-4 text-gray-700">
          Enter a Wikipedia page title to fetch images from that page. This is useful for getting game cover images and other media.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            placeholder="Enter Wikipedia page title (e.g., 'The Legend of Zelda')"
            className="flex-grow p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleFetchImages}
            disabled={loading || !pageTitle.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Loading...' : 'Fetch Images'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {images && (
        <div className="space-y-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">{images.title}</h2>
            </div>
            
            {/* Thumbnail Image */}
            {images.thumbnail && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium mb-2">Thumbnail Image</h3>
                <div className="relative h-64 w-full">
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
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium mb-2">Infobox Image</h3>
                <div className="relative h-64 w-full">
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
                <h3 className="text-lg font-medium mb-2">Additional Images</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {images.images.map((img, index) => (
                    <div key={index} className="border rounded overflow-hidden">
                      <div className="relative h-48 w-full">
                        <Image 
                          src={img.url}
                          alt={img.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="p-2 bg-gray-50 text-xs">
                        <p className="truncate" title={img.title}>{img.title}</p>
                        <p className="text-gray-500">{img.width} × {img.height}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Image IDs */}
            {images.imageIds && (
              <div className="p-4 bg-gray-50 text-sm">
                <h3 className="font-medium mb-1">Image IDs</h3>
                <p className="text-gray-600 break-words">{images.imageIds}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 