'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiImage, FiSearch, FiInfo, FiCamera, FiGrid, FiFileText } from 'react-icons/fi';
import { HiOutlinePhotograph, HiOutlineExclamation } from 'react-icons/hi';

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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-white flex items-center border-b border-accent/30 pb-4">
        <HiOutlinePhotograph className="mr-3 text-accent text-4xl" /> Wikimedia Images Test
      </h1>
      
      <div className="bg-muted p-6 rounded-lg shadow-md border border-accent/30 mb-8 hover:border-accent/50 transition-all">
        <p className="mb-4 text-white/90">
          Enter a Wikipedia page title to fetch images from that page. This is useful for getting game cover images and other media.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Enter Wikipedia page title (e.g., 'The Legend of Zelda')"
              className="w-full p-3 rounded bg-main border border-accent/30 text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <button
            onClick={handleFetchImages}
            disabled={loading || !pageTitle.trim()}
            className="flex items-center justify-center bg-accent text-black font-medium py-2 px-6 rounded hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        <div className="bg-red-900/20 border border-red-600/50 p-4 rounded-lg mb-8 animate-fadeIn">
          <h2 className="text-xl font-bold mb-2 text-white flex items-center">
            <HiOutlineExclamation className="mr-2 text-red-400 text-2xl" /> Error
          </h2>
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      {images && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-muted rounded-lg overflow-hidden border border-accent/30 shadow-lg hover:border-accent/50 transition-all">
            <div className="p-4 border-b border-accent/30 bg-main">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FiFileText className="mr-2 text-accent" /> {images.title}
              </h2>
            </div>
            
            {/* Thumbnail Image */}
            {images.thumbnail && (
              <div className="p-4 border-b border-accent/30">
                <h3 className="text-lg font-medium mb-3 text-white flex items-center">
                  <FiCamera className="mr-2 text-accent" /> Thumbnail Image
                </h3>
                <div className="relative h-64 w-full bg-main rounded-lg overflow-hidden border border-accent/20">
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
              <div className="p-4 border-b border-accent/30">
                <h3 className="text-lg font-medium mb-3 text-white flex items-center">
                  <FiCamera className="mr-2 text-accent" /> Infobox Image
                </h3>
                <div className="relative h-64 w-full bg-main rounded-lg overflow-hidden border border-accent/20">
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
                <h3 className="text-lg font-medium mb-3 text-white flex items-center">
                  <FiGrid className="mr-2 text-accent" /> Additional Images ({images.images.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {images.images.map((img, index) => (
                    <div key={index} className="border border-accent/30 rounded overflow-hidden bg-main hover:border-accent/50 transition-all">
                      <div className="relative h-48 w-full">
                        <Image 
                          src={img.url}
                          alt={img.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="p-2 bg-muted text-xs">
                        <p className="truncate text-white" title={img.title}>{img.title}</p>
                        <p className="text-accent/70">{img.width} × {img.height}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Image IDs */}
            {images.imageIds && (
              <div className="p-4 bg-main text-sm">
                <h3 className="font-medium mb-1 text-white flex items-center">
                  <FiInfo className="mr-2 text-accent" /> Image IDs
                </h3>
                <p className="text-white/70 break-words overflow-auto p-2 bg-black/30 rounded border border-accent/20">{images.imageIds}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 