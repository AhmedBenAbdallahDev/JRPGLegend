'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { FaGamepad, FaTrash, FaPencilAlt, FaGlobeAmericas, FaExternalLinkAlt } from 'react-icons/fa';
import { HiPhotograph } from 'react-icons/hi';
import { getAllROMs, deleteROM } from '@/services/gameStorage';
import { getAllOfflineGames, saveOfflineGame, deleteOfflineGame } from '@/lib/offlineGames';
import { checkLocalStorageCapability, getRegionColor, getRegionName, getImageSource } from '@/components/Badge';
import EnhancedGameCover from '@/components/EnhancedGameCover';

export default function LocalGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  const [editGame, setEditGame] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    region: '',
    localGameFile: null
  });
  
  useEffect(() => {
    // Check if browser supports required features
    const capability = checkLocalStorageCapability();
    setStorageInfo(capability);
    
    if (!capability.hasStorage) {
      setError('Your browser does not support the required storage features');
      setLoading(false);
      return;
    }
    
    loadAllLocalGames();
  }, []);
  
  const loadAllLocalGames = async () => {
    try {
      setLoading(true);
      
      // Get games from both systems
      const indexedDBGames = await getAllROMs() || [];
      const localStorageGames = getAllOfflineGames() || [];
      
      // Combine games from both systems
      // Mark the source of each game so we know which system to use for operations
      const markedIndexedDBGames = indexedDBGames.map(game => ({ 
        ...game, 
        storageSystem: 'indexedDB',
        // Add defaults for properties that might be missing
        description: game.description || '',
        region: game.region || ''
      }));
      
      const markedLocalStorageGames = localStorageGames.map(game => ({ 
        ...game, 
        storageSystem: 'localStorage',
        // Unify property names for consistent display
        platform: game.core,
        // Add defaults for properties that might be missing
        description: game.description || '',
        region: game.region || ''
      }));
      
      // Merge both arrays and sort by title
      const allGames = [...markedIndexedDBGames, ...markedLocalStorageGames]
        .sort((a, b) => a.title.localeCompare(b.title));
      
      setGames(allGames);
      setLoading(false);
    } catch (error) {
      console.error('Error loading games:', error);
      setError('Failed to load local games');
      setLoading(false);
    }
  };
  
  const handleDelete = async (game) => {
    if (!window.confirm(`Are you sure you want to delete "${game.title}"?`)) {
      return;
    }
    
    try {
      if (game.storageSystem === 'indexedDB') {
        await deleteROM(game.id);
      } else if (game.storageSystem === 'localStorage') {
        deleteOfflineGame(game.id);
      }
      
      // Remove the game from the state
      setGames(games.filter(g => !(g.id === game.id && g.storageSystem === game.storageSystem)));
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game');
    }
  };
  
  const handleEdit = (game) => {
    setEditGame(game);
    setFormData({
      title: game.title || '',
      description: game.description || '',
      image: game.image || '',
      region: game.region || '',
      localGameFile: null
    });
    setShowEditModal(true);
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editGame) return;
    
    try {
      if (editGame.storageSystem === 'localStorage') {
        // Update the game in localStorage
        const updatedGame = {
          ...editGame,
          title: formData.title,
          description: formData.description,
          image: formData.image,
          region: formData.region,
          // Re-generate slug from title
          slug: formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
          updatedAt: new Date().toISOString()
        };
        
        // Save the updated game
        saveOfflineGame(updatedGame);
        
        // Update the game in the state
        setGames(games.map(game => 
          (game.id === editGame.id && game.storageSystem === 'localStorage') 
            ? updatedGame 
            : game
        ));
        
        // Close the modal
        setShowEditModal(false);
      } else {
        // For IndexedDB games, we don't have direct editing yet
        // This would require modifications to the gameStorage.js service
        alert('Editing IndexedDB stored games is not supported yet. Please use the localStorage system for editable games.');
      }
    } catch (error) {
      console.error('Error updating game:', error);
      alert(`Failed to update game: ${error.message}`);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const platformLabels = {
    'nes': 'Nintendo Entertainment System',
    'snes': 'Super Nintendo',
    'n64': 'Nintendo 64',
    'gb': 'Game Boy',
    'gbc': 'Game Boy Color',
    'gba': 'Game Boy Advance',
    'nds': 'Nintendo DS',
    'segams': 'Sega Master System',
    'genesis': 'Sega Genesis',
    'segamd': 'Sega Mega Drive',
    'segacd': 'Sega CD',
    'segagg': 'Sega Game Gear',
    'sega32x': 'Sega 32X',
    'saturn': 'Sega Saturn',
    'psx': 'PlayStation',
    'psp': 'PlayStation Portable',
    'arcade': 'Arcade',
    'atari2600': 'Atari 2600',
    'lynx': 'Atari Lynx',
    'pc': 'DOS',
    '3do': '3DO',
    'jaguar': 'Jaguar',
    'neogeo': 'Neo Geo',
    'coleco': 'ColecoVision'
  };
  
  const getPlatformLabel = (platformId) => {
    const normalized = platformId?.toLowerCase();
    return platformLabels[normalized] || platformId;
  };
  
  // Group games by platform
  const gamesByPlatform = games.reduce((acc, game) => {
    const platform = game.platform || game.core || 'unknown';
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(game);
    return acc;
  }, {});
  
  if (error && !storageInfo?.hasStorage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Local Games</h1>
        
        <div className="bg-red-500/20 text-red-500 p-4 rounded mb-6">
          <h2 className="font-medium text-lg">Browser Not Supported</h2>
          <p>
            Your browser does not support IndexedDB or localStorage, which is required
            for storing game ROMs locally. Please try using a modern browser like
            Chrome, Firefox, Edge, or Safari.
          </p>
        </div>
        
        <Link href="/" className="text-accent hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Local Games</h1>
        
        <Link 
          href="/game/add"
          className="bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-dark"
        >
          Add New Game
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-500/20 text-red-500 p-4 rounded mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2">Loading local games...</p>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-8 bg-gray-800 rounded-lg">
          <FaGamepad className="mx-auto h-12 w-12 opacity-50 text-accent mb-3" />
          <h2 className="font-medium text-xl mb-2">No Local Games Found</h2>
          <p className="text-gray-400 mb-4">Add local games to play them offline.</p>
          <Link 
            href="/game/add"
            className="bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-dark"
          >
            Add Your First Game
          </Link>
        </div>
      ) : (
        <div>
          {/* Game count info */}
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <p className="text-gray-300">
              <span className="font-medium text-accent">
                {games.length} {games.length === 1 ? 'game' : 'games'}
              </span> in your local library across {Object.keys(gamesByPlatform).length} platforms.
            </p>
          </div>
          
          {/* Game list by platform */}
          {Object.keys(gamesByPlatform).sort().map(platform => (
            <div key={platform} className="mb-8">
              <h2 className="text-xl font-medium mb-4 border-b border-gray-700 pb-2">
                {getPlatformLabel(platform)}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {gamesByPlatform[platform].map(game => (
                  <div key={`${game.id}-${game.storageSystem}`} className="bg-gray-800 rounded-lg overflow-hidden group">
                    <div className="aspect-[3/2] relative overflow-hidden">
                      <EnhancedGameCover 
                        game={game}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Action buttons - visible on hover */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleEdit(game)}
                          className="p-2 bg-accent rounded-full text-white hover:bg-accent-dark"
                          title="Edit game"
                        >
                          <FaPencilAlt />
                        </button>
                        <Link 
                          href={`/game/${game.slug}`}
                          className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700"
                          title="View game details"
                        >
                          <FaExternalLinkAlt />
                        </Link>
                        <button 
                          onClick={() => handleDelete(game)}
                          className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700"
                          title="Delete game"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      
                      {/* Info badges */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {/* Region badge */}
                        {game.region && (
                          <div className={`${getRegionColor(game.region)} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}>
                            <FaGlobeAmericas className="w-3 h-3" />
                            <span>{getRegionName(game.region)}</span>
                          </div>
                        )}
                        
                        {/* Storage system badge */}
                        <div className={`${game.storageSystem === 'localStorage' ? 'bg-purple-600' : 'bg-green-600'} text-white text-xs px-2 py-0.5 rounded-full`}>
                          {game.storageSystem === 'localStorage' ? 'Metadata Only' : 'Full ROM'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-medium truncate" title={game.title}>{game.title}</h3>
                      {game.description && (
                        <p className="text-gray-400 text-sm line-clamp-2" title={game.description}>
                          {game.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit Game Modal */}
      {showEditModal && editGame && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Game: {editGame.title}</h2>
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Game Title
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md"
                    required
                  />
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Description
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md"
                    rows="3"
                  />
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Cover Image URL
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md"
                    placeholder="URL or wikimedia:title"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Use "wikimedia:Game Title" to automatically fetch covers
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Region
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md"
                  >
                    <option value="">No Region</option>
                    <option value="us">USA</option>
                    <option value="jp">Japan</option>
                    <option value="eu">Europe</option>
                    <option value="world">World</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent rounded-md hover:bg-accent-dark"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Platform options - comprehensive list
const platforms = [
  { value: 'nes', label: 'Nintendo Entertainment System' },
  { value: 'snes', label: 'Super Nintendo' },
  { value: 'n64', label: 'Nintendo 64' },
  { value: 'gb', label: 'Game Boy' },
  { value: 'gbc', label: 'Game Boy Color' },
  { value: 'gba', label: 'Game Boy Advance' },
  { value: 'nds', label: 'Nintendo DS' },
  { value: 'segams', label: 'Sega Master System' },
  { value: 'genesis', label: 'Sega Genesis' },
  { value: 'segamd', label: 'Sega Mega Drive' },
  { value: 'segacd', label: 'Sega CD' },
  { value: 'segagg', label: 'Sega Game Gear' },
  { value: 'sega32x', label: 'Sega 32X' },
  { value: 'saturn', label: 'Sega Saturn' },
  { value: 'psx', label: 'PlayStation' },
  { value: 'psp', label: 'PlayStation Portable' },
  { value: 'arcade', label: 'Arcade' },
  { value: 'atari2600', label: 'Atari 2600' },
  { value: 'lynx', label: 'Atari Lynx' },
  { value: 'pc', label: 'DOS' },
  { value: '3do', label: '3DO' },
  { value: 'jaguar', label: 'Jaguar' },
  { value: 'neogeo', label: 'Neo Geo' },
  { value: 'coleco', label: 'ColecoVision' }
]; 