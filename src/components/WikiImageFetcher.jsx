'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * A component that fetches and displays images from Wikipedia for a given page title
 * 
 * @param {Object} props
 * @param {string} props.pageTitle - The Wikipedia page title to fetch images for
 * @param {string} props.imageType - The type of image to display: 'thumbnail', 'infobox', or 'all'
 * @param {number} props.maxImages - Maximum number of additional images to display (default: 3)
 * @param {boolean} props.showImageIds - Whether to show image IDs (default: false)
 * @param {Function} props.onImagesLoaded - Callback function when images are loaded
 * @param {Function} props.onError - Callback function when an error occurs
 * @returns {JSX.Element}
 */
export default function WikiImageFetcher({ 
  pageTitle, 
  imageType = 'thumbnail', 
  maxImages = 3,
  showImageIds = false,
  onImagesLoaded,
  onError
}) {
  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pageTitle) return;
    
    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`[WikiImageFetcher] Fetching images for: "${pageTitle}"`);
        const response = await fetch(`/api/wikimedia/images?title=${encodeURIComponent(pageTitle)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.info || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[WikiImageFetcher] Received image data:', data);
        
        setImages(data);
        
        // Call the callback if provided
        if (onImagesLoaded) {
          onImagesLoaded(data);
        }
      } catch (err) {
        console.error('[WikiImageFetcher] Error fetching images:', err);
        setError(err.message || 'An error occurred while fetching images');
        
        // Call the error callback if provided
        if (onError) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchImages();
  }, [pageTitle, onImagesLoaded, onError]);

  if (loading) {
    return <div className="text-center py-4">Loading images...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-2">Error: {error}</div>;
  }

  if (!images) {
    return null;
  }

  // Determine which images to display based on imageType
  const displayImages = [];
  
  if (imageType === 'thumbnail' && images.thumbnail) {
    displayImages.push({
      type: 'thumbnail',
      url: images.thumbnail,
      alt: `${images.title} thumbnail`
    });
  }
  
  if (imageType === 'infobox' && images.infoboxImage) {
    displayImages.push({
      type: 'infobox',
      url: images.infoboxImage,
      alt: `${images.title} infobox image`
    });
  }
  
  if (imageType === 'all') {
    if (images.thumbnail) {
      displayImages.push({
        type: 'thumbnail',
        url: images.thumbnail,
        alt: `${images.title} thumbnail`
      });
    }
    
    if (images.infoboxImage && images.infoboxImage !== images.thumbnail) {
      displayImages.push({
        type: 'infobox',
        url: images.infoboxImage,
        alt: `${images.title} infobox image`
      });
    }
  }
  
  // Add additional images if requested
  if (images.images && images.images.length > 0) {
    const additionalImages = images.images
      .filter(img => 
        img.url !== images.thumbnail && 
        img.url !== images.infoboxImage
      )
      .slice(0, maxImages);
    
    displayImages.push(...additionalImages.map(img => ({
      type: 'additional',
      url: img.url,
      alt: img.title,
      title: img.title,
      width: img.width,
      height: img.height
    })));
  }

  return (
    <div className="wiki-image-fetcher">
      {displayImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayImages.map((img, index) => (
            <div key={index} className="border rounded overflow-hidden">
              <div className="relative h-48 w-full">
                <Image 
                  src={img.url}
                  alt={img.alt}
                  fill
                  className="object-contain"
                />
              </div>
              {img.title && (
                <div className="p-2 bg-gray-50 text-xs">
                  <p className="truncate" title={img.title}>{img.title}</p>
                  {img.width && img.height && (
                    <p className="text-gray-500">{img.width} × {img.height}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">No images found</div>
      )}
      
      {showImageIds && images.imageIds && (
        <div className="mt-4 p-2 bg-gray-50 text-xs">
          <p className="font-medium mb-1">Image IDs:</p>
          <p className="text-gray-600 break-words">{images.imageIds}</p>
        </div>
      )}
    </div>
  );
} 