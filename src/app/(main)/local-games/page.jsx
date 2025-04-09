'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaGamepad, FaTrash } from 'react-icons/fa';
import { getAllROMs, deleteROM } from '@/services/gameStorage';
import LocalGameUploader from '@/components/LocalGameUploader';
import { checkLocalStorageCapability } from '@/components/Badge';

export default function LocalGamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  
  useEffect(() => {
    // Check if browser supports required features
    const capability = checkLocalStorageCapability();
    setStorageInfo(capability);
    
    if (!capability.hasStorage) {
      setError('Your browser does not support the required storage features');
      setLoading(false);
      return;
    }
    
    loadGames();
  }, []);
  
  const loadGames = async () => {
    try {
      setLoading(true);
      const allROMs = await getAllROMs();
      setGames(allROMs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading games:', error);
      setError('Failed to load local games');
      setLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this game?')) {
      return;
    }
    
    try {
      await deleteROM(id);
      setGames(games.filter(game => game.id !== id));
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game');
    }
  };
  
  const handleUploadComplete = (updatedGames) => {
    setGames(updatedGames);
  };
  
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
      <h1 className="text-2xl font-bold mb-6">Local Games</h1>
      
      {error && (
        <div className="bg-red-500/20 text-red-500 p-4 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <LocalGameUploader onUploadComplete={handleUploadComplete} />
        </div>
        
        <div>
          <div className="border border-accent p-4 rounded-lg">
            <h2 className="text-lg font-medium mb-4">Your Local Games</h2>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2">Loading games...</p>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <FaGamepad className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">No local games found</p>
                <p className="text-sm">Use the form to add your first game</p>
              </div>
            ) : (
              <ul className="divide-y">
                {games.map(game => (
                  <li key={game.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{game.title}</h3>
                        <p className="text-sm text-gray-500">
                          {platforms.find(p => p.value === game.platform)?.label || game.platform}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(game.dateAdded).toLocaleDateString()} · {(game.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      
                      <div className="flex items-center">
                        <button
                          onClick={() => handleDelete(game.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                          title="Delete game"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Platform options - duplicated from LocalGameUploader for convenience
const platforms = [
  { value: 'nes', label: 'Nintendo Entertainment System' },
  { value: 'snes', label: 'Super Nintendo' },
  { value: 'n64', label: 'Nintendo 64' },
  { value: 'gb', label: 'Game Boy' },
  { value: 'gbc', label: 'Game Boy Color' },
  { value: 'gba', label: 'Game Boy Advance' },
  { value: 'nds', label: 'Nintendo DS' },
  { value: 'genesis', label: 'Sega Genesis' },
  { value: 'segacd', label: 'Sega CD' },
  { value: 'saturn', label: 'Sega Saturn' },
  { value: 'psx', label: 'PlayStation' },
  { value: 'psp', label: 'PlayStation Portable' },
  { value: 'arcade', label: 'Arcade' }
]; 