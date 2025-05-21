'use client';
import { useState } from 'react';
import { storeROM, getAllROMs, ROMS_DIRECTORY } from '@/services/gameStorage';

export default function LocalGameUploader({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [gameTitle, setGameTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // Platform options
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
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus(`Selected file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      
      // Try to extract a game title from the filename
      if (!gameTitle) {
        let filename = file.name;
        // Remove extension
        filename = filename.replace(/\.[^/.]+$/, "");
        // Replace underscores and dashes with spaces
        filename = filename.replace(/[_-]/g, " ");
        // Title case
        filename = filename.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        
        setGameTitle(filename);
      }
      
      // Try to guess platform from file extension
      if (!platform) {
        const extension = file.name.split('.').pop().toLowerCase();
        const extensionToPlatform = {
          'nes': 'nes',
          'smc': 'snes', 'sfc': 'snes',
          'n64': 'n64', 'z64': 'n64',
          'gb': 'gb',
          'gbc': 'gbc',
          'gba': 'gba',
          'nds': 'nds',
          'md': 'genesis', 'bin': 'genesis',
          'iso': 'psx', // Could be many platforms
          'cue': 'segacd'
        };
        
        if (extensionToPlatform[extension]) {
          setPlatform(extensionToPlatform[extension]);
        }
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a ROM file');
      return;
    }
    
    if (!gameTitle) {
      setError('Please enter a game title');
      return;
    }
    
    if (!platform) {
      setError('Please select a platform');
      return;
    }
    
    setUploading(true);
    setError(null);
    setUploadStatus('Starting upload process...');
    
    try {
      setUploadStatus('Uploading ROM file to local storage directory...');
      const storagePath = await storeROM(selectedFile, gameTitle, platform);
      
      console.log(`Game stored at: ${storagePath}`);
      setUploadStatus(`Game successfully stored at: ${storagePath}`);
      
      // Clear form
      setSelectedFile(null);
      setGameTitle('');
      setPlatform('');
      
      // Reset file input
      const fileInput = document.getElementById('rom-file-input');
      if (fileInput) fileInput.value = '';
      
      // Notify parent component
      if (onUploadComplete) {
        const allROMs = getAllROMs();
        onUploadComplete(allROMs);
        setUploadStatus('Upload complete - game added to library!');
      }
      
      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to store ROM file');
      setUploadStatus(`Error: ${error.message}`);
      setUploading(false);
    }
  };
  
  return (
    <div className="border border-accent p-4 rounded-lg">
      <h2 className="text-lg font-medium mb-4">Add Local Game</h2>
      
      {error && (
        <div className="bg-red-500/20 text-red-500 p-2 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            ROM File
            <input
              type="file"
              id="rom-file-input"
              onChange={handleFileChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
              disabled={uploading}
            />
          </label>
          {selectedFile && (
            <p className="text-xs mt-1 text-gray-500">
              {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
          <div className="text-xs mt-1 text-blue-300">
            Debug: File will be copied to /public{ROMS_DIRECTORY} directory
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Game Title
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
              disabled={uploading}
            />
          </label>
          <div className="text-xs mt-1 text-blue-300">
            Debug: This title will be used for display and metadata storage
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Platform
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
              disabled={uploading}
            >
              <option value="">Select Platform</option>
              {platforms.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <div className="text-xs mt-1 text-blue-300">
            Debug: Platform info stored in localStorage under games_{platform}
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Add Game'}
        </button>
        
        {uploadStatus && (
          <div className="mt-2 p-2 bg-black/30 rounded text-sm">
            <div className="font-bold text-xs">Upload Status:</div>
            <div className="text-blue-200">{uploadStatus}</div>
          </div>
        )}
        
        <p className="mt-4 text-xs text-gray-500">
          The game ROM will be stored locally in your application's /public{ROMS_DIRECTORY} directory.
          Metadata is stored in localStorage for easy access.
        </p>
      </form>
    </div>
  );
} 