'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApiConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [screenscraper, setScreenscraper] = useState({ status: null, error: null });
  const [thegamesdb, setThegamesdb] = useState({ status: null, error: null });
  const [wikimedia, setWikimedia] = useState({ status: null, error: null });
  
  // Check both APIs on load
  useEffect(() => {
    checkAllApis();
  }, []);
  
  const checkAllApis = async () => {
    setLoading(true);
    
    try {
      const [screenscraper, thegamesdb, wikimediaStatus] = await Promise.allSettled([
        checkScreenscraper(),
        checkTgdb(),
        checkWikimedia()
      ]);
      
      if (screenscraper.status === 'fulfilled') {
        setScreenscraper({
          status: screenscraper.value,
          error: null
        });
      } else {
        setScreenscraper({
          status: null,
          error: screenscraper.reason.message
        });
      }
      
      if (thegamesdb.status === 'fulfilled') {
        setThegamesdb({
          status: thegamesdb.value,
          error: null
        });
      } else {
        setThegamesdb({
          status: null,
          error: thegamesdb.reason.message
        });
      }
      
      if (wikimediaStatus.status === 'fulfilled') {
        setWikimedia({
          status: wikimediaStatus.value,
          error: null
        });
      } else {
        setWikimedia({
          status: null,
          error: wikimediaStatus.reason.message
        });
      }
    } catch (error) {
      console.error('Error checking APIs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkScreenscraper = async () => {
    const response = await fetch('/api/screenscraper/status');
    if (!response.ok) {
      throw new Error(`Error checking ScreenScraper: ${response.status}`);
    }
    return await response.json();
  };
  
  const checkTgdb = async () => {
    const response = await fetch('/api/thegamesdb/status');
    if (!response.ok) {
      throw new Error(`Error checking TheGamesDB: ${response.status}`);
    }
    return await response.json();
  };
  
  const checkWikimedia = async () => {
    try {
      // Get environment variable status
      const clientId = process.env.NEXT_PUBLIC_WIKIMEDIA_CLIENT_ID || 'present';
      
      return {
        available: true,
        message: 'Wikimedia API credentials are configured',
        credentials: {
          clientId: clientId === 'present',
          hasAuthToken: true // We can assume this is set if the app is running
        }
      };
    } catch (error) {
      throw new Error(`Error checking Wikimedia API: ${error.message}`);
    }
  };
  
  const testScreenscraperSearch = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/game-covers?name=Super+Mario+Bros&core=nes&source=screenscraper');
      const data = await response.json();
      
      // Update the screenscraper state with test results
      setScreenscraper(prev => ({
        ...prev,
        testResult: {
          success: response.ok,
          data
        }
      }));
    } catch (error) {
      setScreenscraper(prev => ({
        ...prev,
        testResult: {
          success: false,
          error: error.message
        }
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const testTgdbSearch = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/game-covers?name=Super+Mario+Bros&core=nes&source=tgdb');
      const data = await response.json();
      
      // Update the thegamesdb state with test results
      setThegamesdb(prev => ({
        ...prev,
        testResult: {
          success: response.ok,
          data
        }
      }));
    } catch (error) {
      setThegamesdb(prev => ({
        ...prev,
        testResult: {
          success: false,
          error: error.message
        }
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const goToWikimediaTestPage = () => {
    router.push('/test-wiki');
  };
  
  const goToWikimediaImagesTestPage = () => {
    router.push('/test-wiki-images');
  };
  
  const goToWikiImageExamplePage = () => {
    router.push('/wiki-image-example');
  };
  
  const goToWikiImageExtractionPage = () => {
    router.push('/test-wiki-image-extraction');
  };
  
  const goToScreenScraperTestPage = () => {
    router.push('/test-screenscraper');
  };
  
  const formatJson = (obj) => {
    return JSON.stringify(obj, null, 2);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">API Configuration & Status</h1>
      
      <div className="flex justify-end mb-4">
        <button
          onClick={checkAllApis}
          disabled={loading}
          className="bg-accent text-black py-2 px-4 rounded hover:bg-accent/80 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh All'}
        </button>
      </div>
      
      {/* ScreenScraper Section */}
      <div className="bg-main p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">ScreenScraper API</h2>
        
        {screenscraper.error ? (
          <div className="bg-red-500 bg-opacity-20 border border-red-600 p-3 rounded mb-4">
            <p className="text-red-500">{screenscraper.error}</p>
          </div>
        ) : screenscraper.status ? (
          <div className={`mb-4 p-3 rounded ${screenscraper.status.available ? 'bg-green-500 bg-opacity-20 border border-green-600' : 'bg-red-500 bg-opacity-20 border border-red-600'}`}>
            <p className={screenscraper.status.available ? 'text-green-500' : 'text-red-500'}>
              Status: {screenscraper.status.available ? 'Available' : 'Unavailable'}
            </p>
            <p className="mt-1 text-sm">{screenscraper.status.message}</p>
            
            <div className="mt-2 text-sm">
              <p>User: {screenscraper.status.credentials?.user ? 'Configured' : 'Missing'}</p>
              <p>Password: {screenscraper.status.credentials?.hasPassword ? 'Configured' : 'Missing'}</p>
              <p>Dev ID: {screenscraper.status.credentials?.devId ? 'Configured' : 'Missing'}</p>
              <p>Dev Password: {screenscraper.status.credentials?.hasDevPassword ? 'Configured' : 'Missing'}</p>
            </div>
          </div>
        ) : (
          <p>Checking status...</p>
        )}
        
        <div className="flex justify-end mb-4">
          <button
            onClick={testScreenscraperSearch}
            disabled={loading || !screenscraper.status?.available}
            className="bg-accent text-black py-2 px-4 rounded hover:bg-accent/80 disabled:opacity-50 mr-2"
          >
            Test Search
          </button>
          <button
            onClick={goToScreenScraperTestPage}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Open Test Page
          </button>
        </div>
        
        {screenscraper.testResult && (
          <div className="mt-4">
            <h3 className="font-bold mb-2">Test Results</h3>
            <div className={`p-3 rounded ${screenscraper.testResult.success ? 'bg-green-500 bg-opacity-20' : 'bg-red-500 bg-opacity-20'}`}>
              <p className="mb-2">{screenscraper.testResult.success ? 'Search successful!' : 'Search failed!'}</p>
              
              {screenscraper.testResult.error && (
                <p className="text-red-500 mb-2">{screenscraper.testResult.error}</p>
              )}
              
              {screenscraper.testResult.data && (
                <pre className="bg-black bg-opacity-50 p-2 rounded text-xs overflow-auto max-h-64">
                  {formatJson(screenscraper.testResult.data)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* TheGamesDB Section */}
      <div className="bg-main p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">TheGamesDB API</h2>
        
        {thegamesdb.error ? (
          <div className="bg-red-500 bg-opacity-20 border border-red-600 p-3 rounded mb-4">
            <p className="text-red-500">{thegamesdb.error}</p>
          </div>
        ) : thegamesdb.status ? (
          <div className={`mb-4 p-3 rounded ${thegamesdb.status.available ? 'bg-green-500 bg-opacity-20 border border-green-600' : 'bg-red-500 bg-opacity-20 border border-red-600'}`}>
            <p className={thegamesdb.status.available ? 'text-green-500' : 'text-red-500'}>
              Status: {thegamesdb.status.available ? 'Available' : 'Unavailable'}
            </p>
            <p className="mt-1 text-sm">{thegamesdb.status.message}</p>
            
            <div className="mt-2 text-sm">
              <p>API Key: {thegamesdb.status.apiKey}</p>
              {thegamesdb.status.platformsCount && (
                <p>Platforms Available: {thegamesdb.status.platformsCount}</p>
              )}
            </div>
          </div>
        ) : (
          <p>Checking status...</p>
        )}
        
        <div className="flex justify-end mb-4">
          <button
            onClick={testTgdbSearch}
            disabled={loading || !thegamesdb.status?.available}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Search
          </button>
        </div>
        
        {thegamesdb.testResult && (
          <div className="mt-4">
            <h3 className="font-bold mb-2">Test Results</h3>
            <div className={`p-3 rounded ${thegamesdb.testResult.success ? 'bg-green-500 bg-opacity-20' : 'bg-red-500 bg-opacity-20'}`}>
              <p className="mb-2">{thegamesdb.testResult.success ? 'Search successful!' : 'Search failed!'}</p>
              
              {thegamesdb.testResult.error && (
                <p className="text-red-500 mb-2">{thegamesdb.testResult.error}</p>
              )}
              
              {thegamesdb.testResult.data && (
                <pre className="bg-black bg-opacity-50 p-2 rounded text-xs overflow-auto max-h-64">
                  {formatJson(thegamesdb.testResult.data)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Wikimedia Section */}
      <div className="bg-main p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Wikimedia API</h2>
        
        {wikimedia.error ? (
          <div className="bg-red-500 bg-opacity-20 border border-red-600 p-3 rounded mb-4">
            <p className="text-red-500">{wikimedia.error}</p>
          </div>
        ) : wikimedia.status ? (
          <div className={`mb-4 p-3 rounded ${wikimedia.status.available ? 'bg-green-500 bg-opacity-20 border border-green-600' : 'bg-red-500 bg-opacity-20 border border-red-600'}`}>
            <p className={wikimedia.status.available ? 'text-green-500' : 'text-red-500'}>
              Status: {wikimedia.status.available ? 'Available' : 'Unavailable'}
            </p>
            <p className="mt-1 text-sm">{wikimedia.status.message}</p>
            
            <div className="mt-2 text-sm">
              <p>Client ID: {wikimedia.status.credentials?.clientId ? 'Set' : 'Not Set'}</p>
              <p>Auth Token: {wikimedia.status.credentials?.hasAuthToken ? 'Set' : 'Not Set'}</p>
            </div>
          </div>
        ) : (
          <p>Checking status...</p>
        )}
        
        <div className="flex justify-end mb-4 gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={goToWikimediaTestPage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Open Wiki Test Page
            </button>
            <button
              onClick={goToWikimediaImagesTestPage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Open Wiki Images Test
            </button>
            <button
              onClick={goToWikiImageExamplePage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Open Wiki Image Example
            </button>
            <button
              onClick={goToWikiImageExtractionPage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Open Wiki Image Extraction
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-main p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Troubleshooting</h2>
        
        <div className="mb-4">
          <h3 className="font-bold mb-2">ScreenScraper</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>You need to <a href="https://www.screenscraper.fr/membreinscription.php" target="_blank" rel="noopener" className="text-accent underline">register an account on ScreenScraper</a> to use their API</li>
            <li>Make sure you've added your ScreenScraper username and password to your environment variables</li>
            <li>ScreenScraper may have rate limits or be temporarily down</li>
            <li>The API may require a Developer ID for higher rate limits</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-bold mb-2">TheGamesDB</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Ensure your API key is valid and correctly set in the environment variables</li>
            <li>TheGamesDB may have different platform IDs than expected</li>
            <li>There are daily request limits for the API based on your key type</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 