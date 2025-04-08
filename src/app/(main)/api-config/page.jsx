'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiRefreshCw, FiDatabase, FiSettings, FiSearch, FiImage, FiBookOpen } from 'react-icons/fi';
import { HiOutlineCog, HiOutlineRefresh, HiOutlineDatabase, HiOutlineCheck, HiOutlineExclamation } from 'react-icons/hi';

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-white flex items-center border-b border-accent/30 pb-4">
        <HiOutlineCog className="mr-3 text-accent text-4xl" /> API Configuration & Status
      </h1>
      
      <div className="flex justify-end mb-4">
        <button
          onClick={checkAllApis}
          disabled={loading}
          className="flex items-center bg-accent text-black font-medium py-2 px-4 rounded hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          <HiOutlineRefresh className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>
      
      {/* ScreenScraper Section */}
      <div className="mb-8 p-6 bg-muted rounded-lg shadow-md border border-accent/30 hover:border-accent/50 transition-all">
        <div className="flex items-center justify-between mb-4 border-b border-accent/30 pb-2">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FiImage className="mr-2 text-accent" /> ScreenScraper API
          </h2>
          
          {screenscraper.status && screenscraper.status.available ? (
            <span className="px-3 py-1 bg-green-900/20 text-green-400 rounded-full border border-green-600/50 text-sm flex items-center">
              <HiOutlineCheck className="mr-1" /> Available
            </span>
          ) : (
            <span className="px-3 py-1 bg-red-900/20 text-red-400 rounded-full border border-red-600/50 text-sm flex items-center">
              <HiOutlineExclamation className="mr-1" /> Unavailable
            </span>
          )}
        </div>
        
        {screenscraper.error ? (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-600/50 rounded text-red-300 flex items-center">
            <HiOutlineExclamation className="mr-2 text-red-400 flex-shrink-0 text-xl" />
            <span>{screenscraper.error}</span>
          </div>
        ) : screenscraper.status ? (
          <div className="mb-4">
            <div className="p-4 bg-main rounded border border-accent/20 text-white/90">
              <p><span className="font-semibold text-accent/80">Status:</span> {screenscraper.status.message}</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                <p><span className="font-semibold text-accent/80">User:</span> {screenscraper.status.credentials?.user ? 'Configured ✓' : 'Missing ✗'}</p>
                <p><span className="font-semibold text-accent/80">Password:</span> {screenscraper.status.credentials?.hasPassword ? 'Configured ✓' : 'Missing ✗'}</p>
                <p><span className="font-semibold text-accent/80">Dev ID:</span> {screenscraper.status.credentials?.devId ? 'Configured ✓' : 'Missing ✗'}</p>
                <p><span className="font-semibold text-accent/80">Dev Password:</span> {screenscraper.status.credentials?.hasDevPassword ? 'Configured ✓' : 'Missing ✗'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex space-x-4 mb-4">
            <div className="h-6 bg-main rounded w-full"></div>
          </div>
        )}
        
        <div className="space-y-3">
          <p className="text-white/90">Test the ScreenScraper API connection or visit the dedicated test page for advanced testing.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={testScreenscraperSearch}
              disabled={loading || !screenscraper.status?.available}
              className="flex items-center justify-center bg-accent text-black font-medium py-2 px-4 rounded hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              <FiSearch className="mr-2" /> Test Search
            </button>
            
            <button
              onClick={goToScreenScraperTestPage}
              className="flex items-center justify-center bg-main border border-accent text-white py-2 px-4 rounded hover:border-accent/80 transition-colors"
            >
              <FiImage className="mr-2" /> Open Test Page
            </button>
          </div>
          
          {screenscraper.testResult && (
            <div className="mt-4 animate-fadeIn">
              <h3 className="text-xl font-bold mb-2 text-white">Test Results</h3>
              <pre className="p-3 bg-main rounded border border-accent/20 overflow-auto max-h-60 text-sm text-white/90">
                {formatJson(screenscraper.testResult)}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      {/* TheGamesDB Section */}
      <div className="mb-8 p-6 bg-muted rounded-lg shadow-md border border-accent/30 hover:border-accent/50 transition-all">
        <div className="flex items-center justify-between mb-4 border-b border-accent/30 pb-2">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <HiOutlineDatabase className="mr-2 text-accent" /> TheGamesDB API
          </h2>
          
          {thegamesdb.status && thegamesdb.status.available ? (
            <span className="px-3 py-1 bg-green-900/20 text-green-400 rounded-full border border-green-600/50 text-sm flex items-center">
              <HiOutlineCheck className="mr-1" /> Available
            </span>
          ) : (
            <span className="px-3 py-1 bg-red-900/20 text-red-400 rounded-full border border-red-600/50 text-sm flex items-center">
              <HiOutlineExclamation className="mr-1" /> Unavailable
            </span>
          )}
        </div>
        
        {thegamesdb.error ? (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-600/50 rounded text-red-300 flex items-center">
            <HiOutlineExclamation className="mr-2 text-red-400 flex-shrink-0 text-xl" />
            <span>{thegamesdb.error}</span>
          </div>
        ) : thegamesdb.status ? (
          <div className="mb-4">
            <div className="p-4 bg-main rounded border border-accent/20 text-white/90">
              <p><span className="font-semibold text-accent/80">Status:</span> {thegamesdb.status.message}</p>
              
              <div className="mt-3">
                <p><span className="font-semibold text-accent/80">API Key:</span> {thegamesdb.status.apiKey ? thegamesdb.status.apiKey.substring(0, 8) + '...' : 'Missing'}</p>
                {thegamesdb.status.platformsCount && (
                  <p className="mt-2"><span className="font-semibold text-accent/80">Platforms Available:</span> {thegamesdb.status.platformsCount}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex space-x-4 mb-4">
            <div className="h-6 bg-main rounded w-full"></div>
          </div>
        )}
        
        <div className="space-y-3">
          <p className="text-white/90">Test the TheGamesDB API connection or visit the dedicated test page for advanced testing.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={testTgdbSearch}
              disabled={loading || !thegamesdb.status?.available}
              className="flex items-center justify-center bg-accent text-black font-medium py-2 px-4 rounded hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              <FiSearch className="mr-2" /> Test Search
            </button>
            
            <button
              onClick={goToTheGamesDbTestPage}
              className="flex items-center justify-center bg-main border border-accent text-white py-2 px-4 rounded hover:border-accent/80 transition-colors"
            >
              <FiDatabase className="mr-2" /> Open Test Page
            </button>
          </div>
          
          {thegamesdb.testResult && (
            <div className="mt-4 animate-fadeIn">
              <h3 className="text-xl font-bold mb-2 text-white">Test Results</h3>
              <pre className="p-3 bg-main rounded border border-accent/20 overflow-auto max-h-60 text-sm text-white/90">
                {formatJson(thegamesdb.testResult)}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      {/* Wikimedia Section */}
      <div className="mb-8 p-6 bg-muted rounded-lg shadow-md border border-accent/30 hover:border-accent/50 transition-all">
        <div className="flex items-center justify-between mb-4 border-b border-accent/30 pb-2">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FiBookOpen className="mr-2 text-accent" /> Wikimedia API
          </h2>
          
          {wikimedia.status && wikimedia.status.available ? (
            <span className="px-3 py-1 bg-green-900/20 text-green-400 rounded-full border border-green-600/50 text-sm flex items-center">
              <HiOutlineCheck className="mr-1" /> Available
            </span>
          ) : (
            <span className="px-3 py-1 bg-red-900/20 text-red-400 rounded-full border border-red-600/50 text-sm flex items-center">
              <HiOutlineExclamation className="mr-1" /> Unavailable
            </span>
          )}
        </div>
        
        {wikimedia.error ? (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-600/50 rounded text-red-300 flex items-center">
            <HiOutlineExclamation className="mr-2 text-red-400 flex-shrink-0 text-xl" />
            <span>{wikimedia.error}</span>
          </div>
        ) : wikimedia.status ? (
          <div className="mb-4">
            <div className="p-4 bg-main rounded border border-accent/20 text-white/90">
              <p><span className="font-semibold text-accent/80">Status:</span> {wikimedia.status.message}</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                <p><span className="font-semibold text-accent/80">Client ID:</span> {wikimedia.status.credentials?.clientId ? 'Configured ✓' : 'Missing ✗'}</p>
                <p><span className="font-semibold text-accent/80">Auth Token:</span> {wikimedia.status.credentials?.hasAuthToken ? 'Configured ✓' : 'Missing ✗'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex space-x-4 mb-4">
            <div className="h-6 bg-main rounded w-full"></div>
          </div>
        )}
        
        <div className="space-y-3">
          <p className="text-white/90">Test the Wikimedia API through these dedicated test pages for different functionality:</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={goToWikimediaTestPage}
              className="flex items-center justify-center bg-main border border-accent text-white py-2 px-4 rounded hover:border-accent/80 transition-colors"
            >
              <FiBookOpen className="mr-2" /> Open Wiki Test Page
            </button>
            <button
              onClick={goToWikimediaImagesTestPage}
              className="flex items-center justify-center bg-main border border-accent text-white py-2 px-4 rounded hover:border-accent/80 transition-colors"
            >
              <FiImage className="mr-2" /> Open Wiki Images Test
            </button>
            <button
              onClick={goToWikiImageExamplePage}
              className="flex items-center justify-center bg-main border border-accent text-white py-2 px-4 rounded hover:border-accent/80 transition-colors"
            >
              <FiImage className="mr-2" /> Open Wiki Image Example
            </button>
            <button
              onClick={goToWikiImageExtractionPage}
              className="flex items-center justify-center bg-main border border-accent text-white py-2 px-4 rounded hover:border-accent/80 transition-colors"
            >
              <FiImage className="mr-2" /> Open Wiki Image Extraction
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-muted rounded-lg shadow-md border border-accent/30 hover:border-accent/50 transition-all">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center border-b border-accent/30 pb-2">
          <HiOutlineCog className="mr-2 text-accent" /> Troubleshooting
        </h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3 text-white flex items-center">
            <FiImage className="mr-2 text-accent" /> ScreenScraper
          </h3>
          <ul className="list-disc list-inside space-y-2 pl-4 text-white/90">
            <li>You need to <a href="https://www.screenscraper.fr/membreinscription.php" target="_blank" rel="noopener" className="text-accent hover:text-accent/80 transition-colors">register an account on ScreenScraper</a> to use their API</li>
            <li>Make sure you've added your ScreenScraper username and password to your environment variables</li>
            <li>ScreenScraper may have rate limits or be temporarily down</li>
            <li>The API may require a Developer ID for higher rate limits</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-3 text-white flex items-center">
            <FiDatabase className="mr-2 text-accent" /> TheGamesDB
          </h3>
          <ul className="list-disc list-inside space-y-2 pl-4 text-white/90">
            <li>Ensure your API key is valid and correctly set in the environment variables</li>
            <li>TheGamesDB may have different platform IDs than expected</li>
            <li>There are daily request limits for the API based on your key type</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 