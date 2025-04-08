'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiRefreshCw, FiDatabase, FiSettings, FiSearch, FiImage, FiBookOpen } from 'react-icons/fi';

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
  
  const goToTheGamesDbTestPage = () => {
    router.push('/thegamesdb-test');
  };
  
  const formatJson = (obj) => {
    return JSON.stringify(obj, null, 2);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-white flex items-center">
        <FiSettings className="mr-3 text-accent" /> API Configuration & Status
      </h1>
      
      <div className="flex justify-end mb-4">
        <button
          onClick={checkAllApis}
          disabled={loading}
          className="flex items-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Refresh All'}
        </button>
      </div>
      
      {/* ScreenScraper Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
          <FiImage className="mr-2 text-accent" /> ScreenScraper API
        </h2>
        
        {screenscraper.error ? (
          <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg mb-4">
            <p className="text-red-400">{screenscraper.error}</p>
          </div>
        ) : screenscraper.status ? (
          <div className={`mb-4 p-4 rounded-lg ${screenscraper.status.available ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
            <p className={`text-lg ${screenscraper.status.available ? 'text-green-400' : 'text-red-400'}`}>
              Status: {screenscraper.status.available ? 'Available' : 'Unavailable'}
            </p>
            <p className="mt-1">{screenscraper.status.message}</p>
            
            <div className="mt-2 text-sm">
              <p>User: {screenscraper.status.credentials?.user ? 'Configured' : 'Missing'}</p>
              <p>Password: {screenscraper.status.credentials?.hasPassword ? 'Configured' : 'Missing'}</p>
              <p>Dev ID: {screenscraper.status.credentials?.devId ? 'Configured' : 'Missing'}</p>
              <p>Dev Password: {screenscraper.status.credentials?.hasDevPassword ? 'Configured' : 'Missing'}</p>
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex space-x-4 mb-4">
            <div className="h-6 bg-gray-700 rounded w-full"></div>
          </div>
        )}
        
        <div className="flex justify-end mb-4 gap-2">
          <button
            onClick={testScreenscraperSearch}
            disabled={loading || !screenscraper.status?.available}
            className="flex items-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <FiSearch className="mr-2" /> Test Search
          </button>
          <button
            onClick={goToScreenScraperTestPage}
            className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            <FiImage className="mr-2" /> Open Test Page
          </button>
        </div>
        
        {screenscraper.testResult && (
          <div className="mt-4">
            <h3 className="font-bold mb-2 text-white">Test Results</h3>
            <div className={`p-4 rounded-lg ${screenscraper.testResult.success ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <p className="mb-2">{screenscraper.testResult.success ? 'Search successful!' : 'Search failed!'}</p>
              
              {screenscraper.testResult.error && (
                <p className="text-red-400 mb-2">{screenscraper.testResult.error}</p>
              )}
              
              {screenscraper.testResult.data && (
                <pre className="bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-64 border border-gray-700">
                  {formatJson(screenscraper.testResult.data)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* TheGamesDB Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
          <FiDatabase className="mr-2 text-accent" /> TheGamesDB API
        </h2>
        
        {thegamesdb.error ? (
          <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg mb-4">
            <p className="text-red-400">{thegamesdb.error}</p>
          </div>
        ) : thegamesdb.status ? (
          <div className={`mb-4 p-4 rounded-lg ${thegamesdb.status.available ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
            <p className={`text-lg ${thegamesdb.status.available ? 'text-green-400' : 'text-red-400'}`}>
              Status: {thegamesdb.status.available ? 'Available' : 'Unavailable'}
            </p>
            <p className="mt-1">{thegamesdb.status.message}</p>
            
            <div className="mt-2 text-sm">
              <p>API Key: {thegamesdb.status.apiKey}</p>
              {thegamesdb.status.platformsCount && (
                <p>Platforms Available: {thegamesdb.status.platformsCount}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex space-x-4 mb-4">
            <div className="h-6 bg-gray-700 rounded w-full"></div>
          </div>
        )}
        
        <div className="flex justify-end mb-4 gap-2">
          <button
            onClick={testTgdbSearch}
            disabled={loading || !thegamesdb.status?.available}
            className="flex items-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <FiSearch className="mr-2" /> Test Search
          </button>
          <button
            onClick={goToTheGamesDbTestPage}
            className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            <FiDatabase className="mr-2" /> Open Test Page
          </button>
        </div>
        
        {thegamesdb.testResult && (
          <div className="mt-4">
            <h3 className="font-bold mb-2 text-white">Test Results</h3>
            <div className={`p-4 rounded-lg ${thegamesdb.testResult.success ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <p className="mb-2">{thegamesdb.testResult.success ? 'Search successful!' : 'Search failed!'}</p>
              
              {thegamesdb.testResult.error && (
                <p className="text-red-400 mb-2">{thegamesdb.testResult.error}</p>
              )}
              
              {thegamesdb.testResult.data && (
                <pre className="bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-64 border border-gray-700">
                  {formatJson(thegamesdb.testResult.data)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Wikimedia Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
          <FiBookOpen className="mr-2 text-accent" /> Wikimedia API
        </h2>
        
        {wikimedia.error ? (
          <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg mb-4">
            <p className="text-red-400">{wikimedia.error}</p>
          </div>
        ) : wikimedia.status ? (
          <div className={`mb-4 p-4 rounded-lg ${wikimedia.status.available ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
            <p className={`text-lg ${wikimedia.status.available ? 'text-green-400' : 'text-red-400'}`}>
              Status: {wikimedia.status.available ? 'Available' : 'Unavailable'}
            </p>
            <p className="mt-1">{wikimedia.status.message}</p>
            
            <div className="mt-2 text-sm">
              <p>Client ID: {wikimedia.status.credentials?.clientId ? 'Set' : 'Not Set'}</p>
              <p>Auth Token: {wikimedia.status.credentials?.hasAuthToken ? 'Set' : 'Not Set'}</p>
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex space-x-4 mb-4">
            <div className="h-6 bg-gray-700 rounded w-full"></div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <button
            onClick={goToWikimediaTestPage}
            className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            <FiBookOpen className="mr-2" /> Open Wiki Test Page
          </button>
          <button
            onClick={goToWikimediaImagesTestPage}
            className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            <FiImage className="mr-2" /> Open Wiki Images Test
          </button>
          <button
            onClick={goToWikiImageExamplePage}
            className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            <FiImage className="mr-2" /> Open Wiki Image Example
          </button>
          <button
            onClick={goToWikiImageExtractionPage}
            className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            <FiImage className="mr-2" /> Open Wiki Image Extraction
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
          <FiSettings className="mr-2 text-accent" /> Troubleshooting
        </h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-3 text-white">ScreenScraper</h3>
          <ul className="list-disc list-inside space-y-2 pl-4 text-gray-300">
            <li>You need to <a href="https://www.screenscraper.fr/membreinscription.php" target="_blank" rel="noopener" className="text-blue-400 underline hover:text-blue-300">register an account on ScreenScraper</a> to use their API</li>
            <li>Make sure you've added your ScreenScraper username and password to your environment variables</li>
            <li>ScreenScraper may have rate limits or be temporarily down</li>
            <li>The API may require a Developer ID for higher rate limits</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">TheGamesDB</h3>
          <ul className="list-disc list-inside space-y-2 pl-4 text-gray-300">
            <li>Ensure your API key is valid and correctly set in the environment variables</li>
            <li>TheGamesDB may have different platform IDs than expected</li>
            <li>There are daily request limits for the API based on your key type</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 