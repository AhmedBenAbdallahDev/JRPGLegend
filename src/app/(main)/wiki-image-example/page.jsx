'use client';

import { useState } from 'react';
import WikiImageFetcher from '@/components/WikiImageFetcher';

export default function WikiImageExamplePage() {
  const [pageTitle, setPageTitle] = useState('The Legend of Zelda');
  const [imageType, setImageType] = useState('thumbnail');
  const [maxImages, setMaxImages] = useState(3);
  const [showImageIds, setShowImageIds] = useState(false);
  
  const handleImagesLoaded = (data) => {
    console.log('Images loaded:', data);
  };
  
  const handleError = (error) => {
    console.error('Error loading images:', error);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">WikiImageFetcher Component Example</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Component Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wikipedia Page Title
            </label>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter Wikipedia page title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image Type
            </label>
            <select
              value={imageType}
              onChange={(e) => setImageType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="thumbnail">Thumbnail Only</option>
              <option value="infobox">Infobox Image Only</option>
              <option value="all">All Images</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Additional Images
            </label>
            <input
              type="number"
              value={maxImages}
              onChange={(e) => setMaxImages(parseInt(e.target.value) || 0)}
              min="0"
              max="10"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showImageIds"
              checked={showImageIds}
              onChange={(e) => setShowImageIds(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showImageIds" className="ml-2 block text-sm text-gray-700">
              Show Image IDs
            </label>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium mb-2">Component Usage</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`<WikiImageFetcher
  pageTitle="${pageTitle}"
  imageType="${imageType}"
  maxImages={${maxImages}}
  showImageIds={${showImageIds}}
  onImagesLoaded={handleImagesLoaded}
  onError={handleError}
/>`}
          </pre>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Component Preview</h2>
        
        <WikiImageFetcher
          pageTitle={pageTitle}
          imageType={imageType}
          maxImages={maxImages}
          showImageIds={showImageIds}
          onImagesLoaded={handleImagesLoaded}
          onError={handleError}
        />
      </div>
    </div>
  );
} 