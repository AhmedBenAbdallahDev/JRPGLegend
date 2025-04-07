'use client';

import { useState } from 'react';

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
      <div style={{ 
        backgroundColor: '#111827', 
        borderRadius: '6px',
        padding: '12px',
        marginTop: '10px'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#d1d5db' }}>
          Game Information (Extracted Text)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {fields.map(field => 
              infobox[field.key] ? (
                <tr key={field.key} style={{ borderBottom: '1px solid #374151' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#9ca3af', width: '30%' }}>
                    {field.label}:
                  </td>
                  <td style={{ padding: '6px 8px', color: '#e5e7eb' }}>
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
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#3b82f6' }}>Wikimedia API Test Page</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter search term"
          style={{ 
            marginRight: '10px', 
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '300px'
          }}
        />
        <button 
          onClick={handleSearch} 
          disabled={loading} 
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Searching...' : 'Search Wikimedia'}
        </button>
      </div>

      {error && (
        <div style={{ 
          color: 'white',
          backgroundColor: '#ef4444', 
          padding: '12px',
          borderRadius: '4px',
          marginTop: '20px' 
        }}>
          <h2 style={{ marginTop: 0 }}>Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{error}</pre>
        </div>
      )}

      {results && (
        <div style={{ marginTop: '20px' }}>
          <h2>Search Results for "{searchTerm}"</h2>
          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {results.map((item) => (
                <div key={item.pageid} style={{ 
                  backgroundColor: '#1f2937',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Title and type */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center', 
                      flexWrap: 'wrap'
                    }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: '#3b82f6', 
                        fontSize: '22px',
                        paddingRight: '10px'
                      }}>
                        {item.title}
                      </h3>
                      {item.isVideoGame && (
                        <span style={{
                          backgroundColor: '#38bdf8',
                          color: '#0c4a6e',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          padding: '3px 6px',
                          borderRadius: '4px'
                        }}>
                          VIDEO GAME
                        </span>
                      )}
                    </div>

                    {/* Main content */}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      {/* Full infobox (with images) */}
                      {item.fullInfoboxHtml ? (
                        <div 
                          className="wikipedia-infobox"
                          style={{ 
                            flex: '0 0 350px',
                            maxWidth: '100%',
                            margin: '0 auto'
                          }}
                          dangerouslySetInnerHTML={{ __html: item.fullInfoboxHtml }} 
                        />
                      ) : item.thumbnail && (
                        // Fallback to just the thumbnail if no infobox
                        <div style={{ flex: '0 0 250px' }}>
                          <img 
                            src={item.thumbnail} 
                            alt={`${item.title} thumbnail`}
                            style={{ 
                              width: '100%',
                              height: 'auto',
                              borderRadius: '4px',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      )}
                      
                      <div style={{ flex: 1, minWidth: '250px' }}>
                        <div dangerouslySetInnerHTML={{ __html: item.snippet }} style={{ marginBottom: '12px' }} />
                        
                        {/* Fallback game infobox data (text only) */}
                        {!item.fullInfoboxHtml && item.infobox && Object.keys(item.infobox).length > 0 && 
                          renderInfoboxData(item.infobox)
                        }
                        
                        <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '16px', marginBottom: '12px' }}>
                          Page ID: {item.pageid} | Word Count: {item.wordcount || 'N/A'} | Size: {item.size || 'N/A'} bytes
                        </div>
                        
                        <a 
                          href={`https://en.wikipedia.org/?curid=${item.pageid}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontSize: '14px'
                          }}
                        >
                          View on Wikipedia
                        </a>
                      </div>
                    </div>

                    {/* Additional styling for Wikipedia infobox */}
                    <style jsx global>{`
                      .wikipedia-infobox th {
                        background-color: #eaecf0;
                        color: #202122;
                        padding: 4px 8px;
                        text-align: left;
                        font-weight: bold;
                      }
                      .wikipedia-infobox td {
                        padding: 4px 8px;
                        color: #202122;
                      }
                      .wikipedia-infobox a {
                        color: #3366cc;
                        text-decoration: none;
                      }
                      .wikipedia-infobox img {
                        max-width: 100%;
                        height: auto;
                        display: block;
                        margin: 0 auto;
                      }
                      .wikipedia-infobox caption {
                        font-weight: bold;
                        padding: 8px;
                        background-color: #eaecf0;
                        color: #202122;
                      }
                      .wikipedia-infobox tr {
                        border-bottom: 1px solid #a2a9b1;
                      }
                    `}</style>

                    {/* Display image IDs for reference */}
                    {item.imageIds && (
                      <div style={{ 
                        backgroundColor: '#111827', 
                        padding: '8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#9ca3af',
                        overflowX: 'auto'
                      }}>
                        <strong>Image IDs:</strong> {item.imageIds}
                      </div>
                    )}
                    
                    {/* Additional images from the page */}
                    {item.images && item.images.length > 0 && (
                      <div>
                        <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '8px' }}>
                          Additional Images ({item.images.length}):
                        </div>
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                          {item.images.map((img, index) => (
                            <div key={index} style={{ flex: '0 0 200px' }}>
                              <div style={{ position: 'relative' }}>
                                <img 
                                  src={img.url} 
                                  alt={img.title}
                                  style={{ 
                                    width: '100%',
                                    height: '150px',
                                    borderRadius: '4px',
                                    objectFit: 'cover'
                                  }}
                                />
                                <div style={{ 
                                  position: 'absolute',
                                  bottom: '0',
                                  left: '0',
                                  right: '0',
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  padding: '4px 8px',
                                  fontSize: '10px',
                                  borderBottomLeftRadius: '4px',
                                  borderBottomRightRadius: '4px'
                                }}>
                                  ID: {img.id || 'N/A'}<br/>
                                  {img.width}×{img.height}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No results found.</p>
          )}
        </div>
      )}
      {!loading && !error && !results && (
         <p style={{ marginTop: '20px' }}>Click the button to search for video games.</p>
      )}
    </div>
  );
} 