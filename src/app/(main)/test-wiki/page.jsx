'use client';

import { useState } from 'react';
import { FiSearch, FiBook, FiDatabase, FiInfo, FiExternalLink } from 'react-icons/fi';
import { HiOutlineBookOpen, HiOutlineExclamation } from 'react-icons/hi'; 
import Image from 'next/image';

export default function TestWikiPage() {
  const [searchTerm, setSearchTerm] = useState('video games');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    console.log(`[TestWikiPage] Initiating search for term: "${searchTerm}"`);
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log(`[TestWikiPage] Fetching from /api/wikimedia with term: "${searchTerm}"`);
      const response = await fetch(`/api/wikimedia?search=${encodeURIComponent(searchTerm)}`);
      console.log(`[TestWikiPage] Received response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TestWikiPage] API responded with error ${response.status}: ${errorText}`);
        throw new Error(`API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[TestWikiPage] Received data:', data);

      if (data.error) {
        console.error('[TestWikiPage] API returned an error object:', data.error);
        setError(data.error.info || 'An unknown error occurred in the API response.');
        setResults(null);
      } else {
        console.log('[TestWikiPage] Search successful, setting results.');
        setResults(data.query?.search || []); 
        setError(null);
      }

    } catch (err) {
      console.error('[TestWikiPage] Caught fetch error:', err);
      setError(err.message || 'Failed to fetch data');
      setResults(null);
    } finally {
      console.log('[TestWikiPage] Search process finished.');
      setLoading(false);
    }
  };

  // Helper to render infobox data as a fallback
  const renderInfoboxData = (infobox) => {
    if (!infobox || Object.keys(infobox).length === 0) {
      return null;
    }

    const fields = [
      { key: 'developer', label: 'Developer' },
      { key: 'publisher', label: 'Publisher' },
      { key: 'releaseDate', label: 'Release Date' },
      { key: 'platforms', label: 'Platforms' },
      { key: 'genre', label: 'Genre' },
      { key: 'mode', label: 'Mode' }
    ];

    return (
      <div className="bg-main rounded-lg p-4 mt-4 border border-accent/30">
        <div className="text-lg font-bold mb-2 text-white flex items-center">
          <FiDatabase className="mr-2 text-accent" /> Game Information (Extracted Text)
        </div>
        <table className="w-full border-collapse">
          <tbody>
            {fields.map(field => 
              infobox[field.key] ? (
                <tr key={field.key} className="border-b border-accent/20">
                  <td className="py-2 px-3 font-bold text-accent/80 w-1/3">
                    {field.label}:
                  </td>
                  <td className="py-2 px-3 text-white">
                    {infobox[field.key]}
                  </td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-white flex items-center border-b border-accent/30 pb-4">
        <HiOutlineBookOpen className="mr-3 text-accent text-4xl" /> Wikimedia API Test Page
      </h1>
      
      <div className="bg-muted p-6 rounded-lg shadow-md border border-accent/30 mb-8 hover:border-accent/50 transition-all">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center">
          <FiSearch className="mr-2 text-accent" /> Search Wikipedia
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter search term"
              className="w-full p-3 rounded bg-main border border-accent/30 text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <button 
            onClick={handleSearch} 
            disabled={loading} 
            className="flex items-center justify-center bg-accent text-black font-medium py-2 px-6 rounded hover:bg-accent/90 disabled:opacity-50 transition-colors"
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
                <FiSearch className="mr-2" /> Search Wikimedia
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
          <pre className="bg-main p-4 rounded text-red-400 whitespace-pre-wrap overflow-auto border border-red-900/50">{error}</pre>
        </div>
      )}

      {results && (
        <div className="bg-muted p-6 rounded-lg shadow-md border border-accent/30 mb-8 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-white border-b border-accent/30 pb-2">
            Search Results for "{searchTerm}" ({results.length} found)
          </h2>
          
          {results.length > 0 ? (
            <div className="space-y-6">
              {results.map((item) => (
                <div key={item.pageid} className="bg-main rounded-lg p-5 border border-accent/20 hover:border-accent/50 transition-all">
                  <div className="space-y-4">
                    {/* Title and type */}
                    <div className="flex justify-between items-center flex-wrap gap-2 border-b border-accent/20 pb-2">
                      <h3 className="text-xl font-bold text-accent">
                        {item.title}
                      </h3>
                      {item.isVideoGame && (
                        <span className="bg-accent/20 text-accent font-medium text-xs py-1 px-3 rounded-full">
                          VIDEO GAME
                        </span>
                      )}
                    </div>

                    {/* Main content */}
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Full infobox (with images) */}
                      {item.fullInfoboxHtml ? (
                        <div 
                          className="wikipedia-infobox flex-shrink-0 md:w-1/3 w-full"
                          dangerouslySetInnerHTML={{ __html: item.fullInfoboxHtml }} 
                        />
                      ) : item.thumbnail && (
                        // Fallback to just the thumbnail if no infobox
                        <div className="flex-shrink-0 md:w-1/3 w-full">
                          <div className="relative w-full aspect-[3/4] border border-accent/30 rounded overflow-hidden bg-black/50">
                            <Image 
                              src={item.thumbnail.source}
                              alt={item.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <p className="text-xs text-accent/70 mt-2">
                            Image via Wikipedia
                          </p>
                        </div>
                      )}

                      {/* Text content */}
                      <div className="flex-grow">
                        {/* Text snippet with HTML formatting */}
                        <div 
                          className="text-white/90 mb-4"
                          dangerouslySetInnerHTML={{ __html: item.snippet }}
                        />
                        
                        {/* Links */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <a 
                            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center bg-accent text-black font-medium py-1 px-3 rounded-full text-sm hover:bg-accent/90 transition-colors"
                          >
                            <FiExternalLink className="mr-1" /> View on Wikipedia
                          </a>
                          
                          {item.pageid && (
                            <a 
                              href={`https://en.wikipedia.org/w/api.php?action=parse&pageid=${item.pageid}&prop=text&format=json&origin=*`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center bg-main border border-accent/30 text-white py-1 px-3 rounded-full text-sm hover:border-accent/70 transition-colors"
                            >
                              <FiDatabase className="mr-1" /> View API Data
                            </a>
                          )}
                        </div>
                        
                        {/* Extracted infobox data */}
                        {item.infobox && renderInfoboxData(item.infobox)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-900/20 border border-yellow-600/50 p-4 rounded-lg">
              <p className="text-yellow-300 flex items-center">
                <HiOutlineExclamation className="mr-2" /> No results found for "{searchTerm}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 