'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiSearch, FiExternalLink } from 'react-icons/fi';

export default function WikipediaTestPage() {
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
      console.error('Wikipedia search error:', err);
      setError(err.message || 'An error occurred while fetching the cover image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Wikipedia Cover Test</h1>
      
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <input
          type="text"
          value={gameTitle}
          onChange={(e) => setGameTitle(e.target.value)}
          placeholder="Enter game title..."
          className="flex-1 rounded border border-gray-300 px-4 py-2"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FiSearch />
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {searchResults && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">{searchResults.title}</h2>
            {searchResults.extract && (
              <p className="text-gray-600 mt-2">{searchResults.extract}</p>
            )}
          </div>
          
          <div className="p-4 flex flex-col items-center">
            {searchResults.coverUrl ? (
              <div className="relative h-64 w-full mb-4">
                <Image 
                  src={searchResults.coverUrl}
                  alt={searchResults.title}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <p className="text-gray-500 mb-4">No cover image available</p>
            )}
            
            {searchResults.pageUrl && (
              <a 
                href={searchResults.pageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <FiExternalLink /> View on Wikipedia
              </a>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <p>Source: {searchResults.source}</p>
            {searchResults.cached && (
              <p>Cached until: {new Date(searchResults.expiresAt).toLocaleString()}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 