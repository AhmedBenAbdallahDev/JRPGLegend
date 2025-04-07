'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GameImage from '@/components/GameImage';

export default function SettingsPage() {
  const [consoles, setConsoles] = useState([]);
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingGame, setEditingGame] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    gameLink: '',
    imageLink: '',
    core: ''
  });

  // Fetch consoles on component mount
  useEffect(() => {
    const fetchConsoles = async () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll use a hardcoded list of common consoles
        const consolesList = [
          { id: 'nes', name: 'Nintendo Entertainment System', core: 'nes' },
          { id: 'snes', name: 'Super Nintendo', core: 'snes' },
          { id: 'n64', name: 'Nintendo 64', core: 'n64' },
          { id: 'gba', name: 'Game Boy Advance', core: 'gba' },
          { id: 'genesis', name: 'Sega Genesis', core: 'genesis' },
          { id: 'psx', name: 'PlayStation', core: 'psx' },
          { id: 'arcade', name: 'Arcade', core: 'arcade' }
        ];
        
        setConsoles(consolesList);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch consoles');
        setLoading(false);
      }
    };

    fetchConsoles();
  }, []);

  // Function to fetch games for a specific console
  const fetchGames = async (consoleId) => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll use localStorage or fetch from a mock API
      const gamesFromStorage = localStorage.getItem(`games_${consoleId}`);
      
      if (gamesFromStorage) {
        setGames(JSON.parse(gamesFromStorage));
      } else {
        // Create empty array for this console
        setGames([]);
        localStorage.setItem(`games_${consoleId}`, JSON.stringify([]));
      }
    } catch (err) {
      setError(`Failed to fetch games for ${consoleId}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle console selection
  const handleConsoleSelect = (console) => {
    setSelectedConsole(console);
    fetchGames(console.id);
  };

  // Handle edit button click
  const handleEditClick = (game) => {
    setEditingGame(game);
    setFormData({
      title: game.title,
      gameLink: game.gameLink,
      imageLink: game.imageLink || '',
      core: game.core
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle save changes
  const handleSaveChanges = () => {
    // Validate required fields
    if (!formData.title || !formData.gameLink) {
      setError('Title and Game Link are required');
      return;
    }

    // Update the game
    const updatedGames = games.map(game => 
      game.id === editingGame.id 
        ? { ...game, ...formData } 
        : game
    );
    
    // Save to localStorage
    localStorage.setItem(`games_${selectedConsole.id}`, JSON.stringify(updatedGames));
    
    // Update state
    setGames(updatedGames);
    setEditingGame(null);
    setFormData({ title: '', gameLink: '', imageLink: '', core: '' });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingGame(null);
    setFormData({ title: '', gameLink: '', imageLink: '', core: '' });
  };

  // Handle add new game
  const handleAddGame = () => {
    // Validate required fields
    if (!formData.title || !formData.gameLink) {
      setError('Title and Game Link are required');
      return;
    }

    // Create new game object
    const newGame = {
      id: Date.now().toString(),
      ...formData,
      core: selectedConsole.core // Use the console's core by default
    };
    
    // Add to games list
    const updatedGames = [...games, newGame];
    
    // Save to localStorage
    localStorage.setItem(`games_${selectedConsole.id}`, JSON.stringify(updatedGames));
    
    // Update state
    setGames(updatedGames);
    setFormData({ title: '', gameLink: '', imageLink: '', core: '' });
  };

  // Handle delete game
  const handleDeleteGame = (gameId) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      const updatedGames = games.filter(game => game.id !== gameId);
      
      // Save to localStorage
      localStorage.setItem(`games_${selectedConsole.id}`, JSON.stringify(updatedGames));
      
      // Update state
      setGames(updatedGames);
      
      // If the game being deleted is currently being edited, reset the form
      if (editingGame && editingGame.id === gameId) {
        setEditingGame(null);
        setFormData({ title: '', gameLink: '', imageLink: '', core: '' });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Game Settings</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg">
          {error}
          <button 
            className="ml-2 text-red-200 hover:text-white"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Console Selection */}
        <div className="col-span-1">
          <h2 className="text-xl font-bold mb-4 text-white">Consoles</h2>
          <div className="bg-gray-800 p-4 rounded-lg">
            {loading && !consoles.length ? (
              <div className="text-gray-400">Loading consoles...</div>
            ) : (
              <ul className="space-y-2">
                {consoles.map((console) => (
                  <li key={console.id}>
                    <button
                      className={`w-full text-left p-2 rounded ${
                        selectedConsole?.id === console.id 
                          ? 'bg-accent text-black font-bold' 
                          : 'hover:bg-gray-700 text-white'
                      }`}
                      onClick={() => handleConsoleSelect(console)}
                    >
                      {console.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Games Management */}
        <div className="col-span-1 md:col-span-3">
          {selectedConsole ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  {selectedConsole.name} Games
                </h2>
                <button
                  className="bg-accent hover:bg-accent/80 text-black px-4 py-2 rounded-lg"
                  onClick={() => {
                    setEditingGame({ id: 'new' });
                    setFormData({ 
                      title: '', 
                      gameLink: '', 
                      imageLink: '', 
                      core: selectedConsole.core 
                    });
                  }}
                >
                  Add New Game
                </button>
              </div>
              
              {/* Edit Form */}
              {editingGame && (
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-bold mb-4 text-white">
                    {editingGame.id === 'new' ? 'Add New Game' : 'Edit Game'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                        placeholder="Game Title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        Game Link (ROM URL)
                      </label>
                      <input
                        type="text"
                        name="gameLink"
                        value={formData.gameLink}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                        placeholder="https://example.com/game.rom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        Image Link (optional - will use Wikimedia API if empty)
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          name="imageLink"
                          value={formData.imageLink}
                          onChange={handleInputChange}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                          placeholder="https://example.com/image.jpg"
                        />
                        {formData.title && (
                          <button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded"
                            onClick={async () => {
                              if (!formData.title) return;
                              
                              try {
                                const response = await fetch(`/api/game-images?name=${encodeURIComponent(formData.title)}&console=${encodeURIComponent(formData.core || selectedConsole.core)}`);
                                if (response.ok) {
                                  const data = await response.json();
                                  if (data.success && data.imageUrl) {
                                    setFormData(prev => ({
                                      ...prev,
                                      imageLink: data.imageUrl
                                    }));
                                  }
                                }
                              } catch (err) {
                                console.error('Error fetching image:', err);
                              }
                            }}
                          >
                            Search
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Image Preview */}
                    <div className="mt-3">
                      <label className="block text-sm text-gray-300 mb-1">
                        Image Preview
                      </label>
                      <div className="bg-gray-900 p-3 rounded">
                        <GameImage
                          title={formData.title}
                          core={formData.core || selectedConsole.core}
                          imageLink={formData.imageLink}
                          width={150}
                          height={150}
                          className="rounded mx-auto"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        Emulator Core
                      </label>
                      <input
                        type="text"
                        name="core"
                        value={formData.core}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                        placeholder="nes, snes, n64, etc."
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="bg-accent hover:bg-accent/80 text-black px-4 py-2 rounded"
                        onClick={editingGame.id === 'new' ? handleAddGame : handleSaveChanges}
                      >
                        {editingGame.id === 'new' ? 'Add Game' : 'Save Changes'}
                      </button>
                      <button
                        className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Games List */}
              {loading ? (
                <div className="text-gray-400">Loading games...</div>
              ) : games.length === 0 ? (
                <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-400">
                  <p>No games added for this console yet.</p>
                  <button
                    className="mt-4 bg-accent hover:bg-accent/80 text-black px-4 py-2 rounded"
                    onClick={() => {
                      setEditingGame({ id: 'new' });
                      setFormData({ 
                        title: '', 
                        gameLink: '', 
                        imageLink: '', 
                        core: selectedConsole.core 
                      });
                    }}
                  >
                    Add Your First Game
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {games.map((game) => (
                    <div key={game.id} className="bg-gray-800 p-4 rounded-lg flex">
                      <div className="h-24 w-24 relative mr-4 flex-shrink-0">
                        <GameImage
                          title={game.title}
                          core={game.core}
                          imageLink={game.imageLink}
                          alt={game.title}
                          width={96}
                          height={96}
                          className="rounded"
                          onLoad={(imageUrl) => {
                            // If the game doesn't have an imageLink and we found one from wikimedia,
                            // update the game with the new image URL
                            if (!game.imageLink && imageUrl) {
                              console.log(`[Settings] Got image from Wikimedia for ${game.title}`);
                              
                              // Instead of storing the full URL, store a flag to use Wikimedia
                              const wikimediaFlag = `wikimedia:${encodeURIComponent(game.title)}`;
                              
                              // Create updated game with the Wikimedia flag
                              const updatedGame = {
                                ...game,
                                imageLink: wikimediaFlag
                              };
                              
                              // Update the games array
                              const updatedGames = games.map(g => 
                                g.id === game.id ? updatedGame : g
                              );
                              
                              // Save to localStorage for future use
                              localStorage.setItem(`games_${selectedConsole.id}`, JSON.stringify(updatedGames));
                              
                              // No need to update the state here as it would cause a re-render loop
                              console.log(`[Settings] Saved Wikimedia flag for ${game.title}: ${wikimediaFlag}`);
                            }
                          }}
                        />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-lg font-bold text-white">{game.title}</h3>
                        <p className="text-sm text-gray-400 truncate">{game.gameLink}</p>
                        <p className="text-sm text-gray-400">Core: {game.core}</p>
                        <div className="mt-2 flex space-x-2">
                          <button
                            className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
                            onClick={() => handleEditClick(game)}
                          >
                            Edit
                          </button>
                          <button
                            className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
                            onClick={() => handleDeleteGame(game.id)}
                          >
                            Delete
                          </button>
                          <Link
                            href={`/play?game=${encodeURIComponent(JSON.stringify(game))}`}
                            className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs"
                          >
                            Play
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg flex items-center justify-center min-h-[200px]">
              <p className="text-gray-400">Select a console to manage games</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 