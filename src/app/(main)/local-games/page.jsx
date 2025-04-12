'use client';;
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaGamepad, FaTrash, FaPencilAlt } from 'react-icons/fa';
import { getAllROMs, deleteROM } from '@/services/gameStorage';
import { getAllOfflineGames, saveOfflineGame, deleteOfflineGame } from '@/lib/offlineGames';
import { checkLocalStorageCapability, getRegionColor, getRegionName } from '@/components/Badge';
import EnhancedGameCover from '@/components/EnhancedGameCover';

export default function LocalGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  const [editGame, setEditGame] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
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
  
  const loadAllLocalGames = () => {
    try {
      setLoading(true);
      setDebugInfo('Loading games from local storage...');
      
      // Get games from both systems - note that getAllROMs is now synchronous
      const fileSystemGames = getAllROMs() || [];
      const localStorageGames = getAllOfflineGames() || [];
      
      setDebugInfo(`Found ${fileSystemGames.length} file system games and ${localStorageGames.length} localStorage games`);
      
      // Mark the source of each game so we know which system to use for operations
      const markedFileSystemGames = fileSystemGames.map(game => ({ 
        ...game, 
        storageSystem: 'fileSystem',
        // Add defaults for properties that might be missing
        description: game.description || '',
        region: game.region || '',
        storagePath: game.storagePath || ''
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
      const allGames = [...markedFileSystemGames, ...markedLocalStorageGames]
        .sort((a, b) => a.title.localeCompare(b.title));
      
      setGames(allGames);
      setDebugInfo(`Total games found: ${allGames.length}`);
      setLoading(false);
    } catch (error) {
      console.error('Error loading games:', error);
      setError('Failed to load local games');
      setDebugInfo(`Error: ${error.message}`);
      setLoading(false);
    }
  };
  
  const handleDelete = async (game) => {
    if (!window.confirm(`Are you sure you want to delete "${game.title}"?`)) {
      return;
    }
    
    try {
      if (game.storageSystem === 'fileSystem') {
        // Now deleteROM is synchronous
        const result = deleteROM(game.id);
        if (result) {
          setDebugInfo(`Successfully deleted file system game: ${game.title}`);
        } else {
          throw new Error('Failed to delete ROM metadata');
        }
      } else if (game.storageSystem === 'localStorage') {
        deleteOfflineGame(game.id);
        setDebugInfo(`Successfully deleted localStorage game: ${game.title}`);
      }
      
      // Remove the game from the state
      setGames(games.filter(g => !(g.id === game.id && g.storageSystem === game.storageSystem)));
    } catch (error) {
      console.error('Error deleting game:', error);
      setDebugInfo(`Error deleting game: ${error.message}`);
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
    
    const storagePath = game.storagePath || game.gameLink || '';
    setDebugInfo(`Editing game: ${game.title}, Storage path: ${storagePath}, Storage system: ${game.storageSystem}`);
    
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
      
      {debugInfo && (
        <div className="bg-blue-500/20 text-blue-300 p-3 rounded mb-6 text-sm">
          <div className="font-bold">Debug Information:</div>
          <div>{debugInfo}</div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mr-2"></div>
          Loading games...
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-10">
          <div className="bg-primary p-6 rounded-lg inline-block mb-4">
            <FaGamepad className="text-4xl text-accent mx-auto mb-2" />
            <h2 className="text-xl font-bold">No Local Games Found</h2>
            <p className="text-gray-400 mt-2">
              You haven't added any local games yet.
            </p>
          </div>
          <div>
            <Link 
              href="/game/add"
              className="bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-dark"
            >
              Add Your First Game
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(gamesByPlatform).map(([platform, platformGames]) => (
              <div 
                key={platform} 
                className="bg-primary p-4 rounded-lg"
              >
                <h2 className="text-xl font-bold mb-4 border-b border-accent pb-2">
                  {getPlatformLabel(platform)} ({platformGames.length})
                </h2>
                
                <div className="space-y-3">
                  {platformGames.map(game => (
                    <div key={`${game.id}-${game.storageSystem}`} className="flex bg-black/30 rounded-lg overflow-hidden">
                      <div className="w-20 h-20 flex-shrink-0">
                        <EnhancedGameCover 
                          game={game} 
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-2 flex-grow">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm flex-grow">{game.title}</h3>
                          <div className="flex space-x-1">
                            <button 
                              onClick={() => handleEdit(game)}
                              className="p-1 rounded hover:bg-accent/20 text-accent"
                              title="Edit"
                            >
                              <FaPencilAlt size={12} />
                            </button>
                            <button 
                              onClick={() => handleDelete(game)}
                              className="p-1 rounded hover:bg-red-500/20 text-red-500"
                              title="Delete"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex space-x-1 mt-1 items-center text-xs">
                          <span className="text-gray-400">Storage: </span>
                          <span className={game.storageSystem === 'fileSystem' ? 'text-green-400' : 'text-blue-400'}>
                            {game.storageSystem}
                          </span>
                        </div>
                        
                        {game.region && (
                          <div 
                            className="inline-block px-1 text-xs rounded mt-1"
                            style={{ backgroundColor: getRegionColor(game.region) }}
                          >
                            {getRegionName(game.region)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && editGame && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-primary rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-accent">
              <h2 className="text-lg font-bold">Edit Game</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Title
                  <input 
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-black/30 rounded border border-accent mt-1"
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
                    className="w-full p-2 bg-black/30 rounded border border-accent mt-1"
                    rows={3}
                  />
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Image URL/Path
                  <input 
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-black/30 rounded border border-accent mt-1"
                  />
                </label>
                <div className="mt-1 p-2 bg-blue-950/50 rounded text-xs">
                  <div className="font-bold">Current image path:</div>
                  <div className="text-blue-300 break-all">{editGame.image || 'No image path'}</div>
                  <div className="mt-1 font-bold">Image source type:</div>
                  <div className="text-blue-300">{getImageSource(editGame)}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Region
                  <input 
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-black/30 rounded border border-accent mt-1"
                    placeholder="us, jp, eu, etc."
                  />
                </label>
              </div>
              
              {editGame.storageSystem === 'fileSystem' ? (
                <div className="mb-4 p-2 bg-orange-950/50 rounded text-xs">
                  <div className="font-bold">Game ROM file path:</div>
                  <div className="text-orange-300 break-all">{editGame.storagePath || 'Unknown path'}</div>
                  <div className="mt-1 text-orange-300">
                    File is stored in public{ROMS_DIRECTORY} directory
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-2 bg-green-950/50 rounded text-xs">
                  <div className="font-bold">Game ROM file path:</div>
                  <div className="text-green-300 break-all">{editGame.gameLink || 'Unknown path'}</div>
                  <div className="mt-1 text-green-300">
                    Game data stored in localStorage under games_{editGame.core}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-accent text-accent rounded hover:bg-accent hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-dark transition-colors"
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