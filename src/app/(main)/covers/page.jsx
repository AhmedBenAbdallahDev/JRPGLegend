'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiSearch, FiTrash2, FiFilter, FiX } from 'react-icons/fi';
import { SiNintendo, SiSega, SiPlaystation } from 'react-icons/si';
import { FaGamepad, FaMobileAlt, FaDice } from 'react-icons/fa';

export default function CoverManagerPage() {
  const [loading, setLoading] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [platform, setPlatform] = useState('nes');
  const [cacheStats, setCacheStats] = useState({ count: 0, size: 0 });
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedConsole, setSelectedConsole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cachedCovers, setCachedCovers] = useState([]);
  const [selectedCovers, setSelectedCovers] = useState(new Set());

  // Available consoles for filtering
  const consoles = [
    { id: 'all', name: 'All Consoles' },
    // Nintendo
    { id: 'nes', name: 'Nintendo Entertainment System' },
    { id: 'snes', name: 'Super Nintendo' },
    { id: 'n64', name: 'Nintendo 64' },
    { id: 'gb', name: 'Game Boy' },
    { id: 'gbc', name: 'Game Boy Color' },
    { id: 'gba', name: 'Game Boy Advance' },
    { id: 'nds', name: 'Nintendo DS' },
    // Sega
    { id: 'genesis', name: 'Sega Genesis' },
    { id: 'segacd', name: 'Sega CD' },
    { id: 'saturn', name: 'Sega Saturn' },
    // Sony
    { id: 'psx', name: 'PlayStation' },
    { id: 'psp', name: 'PlayStation Portable' },
    // Other
    { id: 'arcade', name: 'Arcade' }
  ];

  // Group consoles by publisher
  const groupedConsoles = {
    nintendo: consoles.filter(c => ['nes', 'snes', 'n64', 'gb', 'gbc', 'gba', 'nds'].includes(c.id)),
    sega: consoles.filter(c => ['genesis', 'segacd', 'saturn'].includes(c.id)),
    sony: consoles.filter(c => ['psx', 'psp'].includes(c.id)),
    other: consoles.filter(c => ['arcade'].includes(c.id))
  };

  // Load cache stats and history on mount
  useEffect(() => {
    updateCacheStats();
    loadSearchHistory();
    loadCachedCovers();
  }, []);

  const loadCachedCovers = () => {
    try {
      if (typeof window !== 'undefined') {
        const covers = [];
        
        // Iterate through localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('cover_')) {
            try {
              const item = JSON.parse(localStorage.getItem(key));
              const [source, gameName, console] = key.replace('cover_', '').split(':');
              
              covers.push({
                key,
                gameName: decodeURIComponent(gameName),
                console,
                date: new Date(item.timestamp).toLocaleDateString(),
                url: item.url
              });
            } catch (err) {
              console.error("Error parsing cache item:", err);
            }
          }
        }
        
        // Sort by most recent first
        covers.sort((a, b) => new Date(b.date) - new Date(a.date));
        setCachedCovers(covers);
      }
    } catch (err) {
      console.error("Error loading cached covers:", err);
    }
  };

  const updateCacheStats = () => {
    try {
      if (typeof window !== 'undefined') {
        let count = 0;
        let totalSize = 0;
        const history = [];

        // Iterate through localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('cover_')) {
            count++;
            const item = localStorage.getItem(key);
            totalSize += item.length * 2; // Rough estimate of size in bytes
            
            try {
              const { url, timestamp } = JSON.parse(item);
              const gameName = key.replace('cover_screenscraper:', '').split(':')[0];
              const date = new Date(timestamp);
              
              history.push({
                key,
                gameName: decodeURIComponent(gameName),
                date: date.toLocaleDateString(),
                url
              });
            } catch (err) {
              console.error("Error parsing cache item:", err);
            }
          }
        }

        // Sort by most recent first
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setCacheStats({
          count,
          size: (totalSize / 1024 / 1024).toFixed(2) // Convert to MB
        });
        
        setSearchHistory(history.slice(0, 20)); // Show most recent 20
      }
    } catch (err) {
      console.error("Error calculating cache stats:", err);
    }
  };

  const loadSearchHistory = () => {
    try {
      const savedHistory = localStorage.getItem('cover_search_history');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error("Error loading search history:", err);
    }
  };

  const purgeAllCache = () => {
    if (!confirm('Are you sure you want to delete ALL cached covers? This cannot be undone.')) {
      return;
    }
    
    try {
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('cover_')) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        setSearchHistory([]);
        setCachedCovers([]);
        setSelectedCovers(new Set());
        updateCacheStats();
        
        alert(`Successfully cleared ${keysToRemove.length} cached covers`);
      }
    } catch (err) {
      console.error("Error purging cache:", err);
      alert("Error purging cache: " + err.message);
    }
  };

  const deleteSelectedCovers = () => {
    if (selectedCovers.size === 0) {
      alert('Please select covers to delete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedCovers.size} selected covers?`)) {
      return;
    }

    try {
      selectedCovers.forEach(key => {
        localStorage.removeItem(key);
      });
      
      setSelectedCovers(new Set());
      loadCachedCovers();
      updateCacheStats();
      
      alert(`Successfully deleted ${selectedCovers.size} covers`);
    } catch (err) {
      console.error("Error deleting selected covers:", err);
      alert("Error deleting covers: " + err.message);
    }
  };

  const deleteConsoleCovers = (consoleId) => {
    if (!confirm(`Are you sure you want to delete ALL covers for ${consoles.find(c => c.id === consoleId)?.name}?`)) {
      return;
    }

    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('cover_') && key.split(':').pop() === consoleId) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      loadCachedCovers();
      updateCacheStats();
      
      alert(`Successfully deleted ${keysToRemove.length} covers for ${consoles.find(c => c.id === consoleId)?.name}`);
    } catch (err) {
      console.error("Error deleting console covers:", err);
      alert("Error deleting covers: " + err.message);
    }
  };

  const toggleCoverSelection = (key) => {
    const newSelected = new Set(selectedCovers);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCovers(newSelected);
  };

  const deleteCover = (key) => {
    try {
      localStorage.removeItem(key);
      loadCachedCovers();
      updateCacheStats();
    } catch (err) {
      console.error("Error deleting cover:", err);
      alert("Error deleting cover: " + err.message);
    }
  };

  const filteredCovers = cachedCovers.filter(cover => {
    const matchesConsole = selectedConsole === 'all' || cover.console === selectedConsole;
    const matchesSearch = !searchQuery || 
      cover.gameName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesConsole && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6 text-white">Game Cover Cache Manager</h1>
      
      {/* Cache Stats and Bulk Delete */}
      <div className="bg-main p-4 rounded-lg mb-8">
        <div className="flex flex-wrap justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold mb-2 text-white">Cache Statistics</h2>
            <p className="text-gray-300">Total Covers Cached: <span className="text-accent font-bold">{cacheStats.count}</span></p>
            <p className="text-gray-300">Estimated Size: <span className="text-accent font-bold">{cacheStats.size} MB</span></p>
          </div>
          <div className="flex gap-2">
          <button
            onClick={purgeAllCache}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
              <FiTrash2 /> Clear All Cache
          </button>
          </div>
        </div>
        
        {/* Bulk Delete Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-white">Bulk Delete by Console</h3>
          
          {/* Nintendo Dropdown */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FaGamepad className="text-accent" size={20} />
              <span className="font-medium text-white">Nintendo</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ml-6">
              {groupedConsoles.nintendo.map(console => (
                <button
                  key={console.id}
                  onClick={() => deleteConsoleCovers(console.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                >
                  <FiTrash2 size={14} /> {console.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sega Dropdown */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <SiSega className="text-accent" size={20} />
              <span className="font-medium text-white">Sega</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ml-6">
              {groupedConsoles.sega.map(console => (
                <button
                  key={console.id}
                  onClick={() => deleteConsoleCovers(console.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                >
                  <FiTrash2 size={14} /> {console.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sony Dropdown */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <SiPlaystation className="text-accent" size={20} />
              <span className="font-medium text-white">Sony</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ml-6">
              {groupedConsoles.sony.map(console => (
                <button
                  key={console.id}
                  onClick={() => deleteConsoleCovers(console.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                >
                  <FiTrash2 size={14} /> {console.name}
                </button>
              ))}
            </div>
          </div>

          {/* Other Dropdown */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FaDice className="text-accent" size={20} />
              <span className="font-medium text-white">Other</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ml-6">
              {groupedConsoles.other.map(console => (
                <button
                  key={console.id}
                  onClick={() => deleteConsoleCovers(console.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                >
                  <FiTrash2 size={14} /> {console.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="bg-main p-4 rounded-lg mb-8">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-1">Search Cached Covers</label>
            <div className="relative">
            <input
              type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by game name..."
                className="w-full bg-dark text-white px-4 py-2 rounded pl-10"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-1">Filter by Console</label>
            <select
              value={selectedConsole}
              onChange={(e) => setSelectedConsole(e.target.value)}
              className="w-full bg-dark text-white px-4 py-2 rounded"
            >
              {consoles.map(console => (
                <option key={console.id} value={console.id}>{console.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {selectedCovers.size > 0 && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-accent">{selectedCovers.size} covers selected</span>
        <button
              onClick={deleteSelectedCovers}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
              <FiTrash2 /> Delete Selected
        </button>
          </div>
        )}
      </div>
      
      {/* Cached Covers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredCovers.map((cover) => (
          <div 
            key={cover.key}
            className={`bg-main p-4 rounded-lg relative group ${
              selectedCovers.has(cover.key) ? 'ring-2 ring-accent' : ''
            }`}
          >
            <div className="aspect-square relative mb-2">
                  <Image
                src={cover.url}
                alt={cover.gameName}
                fill
                className="object-cover rounded"
                  />
                </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-white truncate">{cover.gameName}</h3>
                <p className="text-sm text-gray-400">{cover.console.toUpperCase()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => deleteCover(cover.key)}
                  className="p-1 rounded text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
    </div>
  );
} 