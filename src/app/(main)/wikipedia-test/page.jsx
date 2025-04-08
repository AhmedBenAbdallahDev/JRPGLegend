'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiSearch, FiExternalLink, FiBook, FiImage, FiInfo, FiClock } from 'react-icons/fi';

export default function WikimediaTestPage() {
  const [loading, setLoading] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!gameTitle.trim()) return;
    
    setLoading(true);
    setError(null);
    setSearchResults(null);
    
    try {
      const response = await fetch(`/api/wikipedia/cover?game=${encodeURIComponent(gameTitle.trim())}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cover image');
      }
      
      setSearchResults(data);
    } catch (err) {
      console.error('Wikimedia search error:', err);
      setError(err.message || 'An error occurred while fetching the cover image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-white flex items-center">
        <FiBook className="mr-3 text-accent" /> Wikimedia Cover Test
      </h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
          <FiSearch className="mr-2 text-blue-400" /> Search for Game Cover
        </h2>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="Enter game title..."
              className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center justify-center bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              <span className="flex items-center">
                <FiSearch className="mr-2" /> Find Cover
              </span>
            )}
          </button>
        </form>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-2 text-white flex items-center">
            <FiInfo className="mr-2 text-red-400" /> Error
          </h2>
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      {searchResults && (
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
          <div className="p-4 border-b border-gray-700 bg-gray-900/50">
            <h2 className="text-xl font-semibold text-white">{searchResults.title}</h2>
            {searchResults.extract && (
              <p className="text-gray-300 mt-2">{searchResults.extract}</p>
            )}
          </div>
          
          <div className="p-6 flex flex-col items-center">
            {searchResults.coverUrl ? (
              <div className="relative h-64 w-full max-w-md mb-4 bg-gray-900 border border-gray-700 p-2 rounded-lg overflow-hidden">
                <Image 
                  src={searchResults.coverUrl}
                  alt={searchResults.title}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="text-yellow-300 mb-4 bg-yellow-900/30 p-4 rounded-lg border border-yellow-700 flex items-center">
                <FiImage className="mr-2" /> No cover image available
              </div>
            )}
            
            {searchResults.pageUrl && (
              <a 
                href={searchResults.pageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors mt-4"
              >
                <FiExternalLink /> View on Wikipedia
              </a>
            )}
          </div>
          
          <div className="bg-gray-900/50 px-4 py-3 text-sm text-gray-400 border-t border-gray-700">
            <p className="flex items-center"><FiInfo className="mr-2" /> Source: {searchResults.source}</p>
            {searchResults.cached && (
              <p className="flex items-center mt-1"><FiClock className="mr-2" /> Cached until: {new Date(searchResults.expiresAt).toLocaleString()}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 