'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoIcon, MagnifyingGlassIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function GameForm({ categories = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    imageSource: 'custom', // 'custom', 'local', 'auto'
    localImage: null, // For local image file
    localImageName: '',
    apiImageUrl: '',
    gameLink: '',
    localGame: false, // Whether this is a local game
    localGameFile: null, // For local ROM file
    localGameFileName: '',
    core: '',
    region: '', // Empty string instead of 'us' default
    category: { id: '', title: '' }
  });

  // State for API search
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [previewImage, setPreviewImage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Special case for app-local images - they need to be uploaded to the server's /public/game/ directory
      if (formData.imageSource === 'local' && formData.localImage) {
        // Create a FormData object just for the image upload
        const imageFormData = new FormData();
        imageFormData.append('file', formData.localImage);
        
        // Upload the image file to our server
        console.log(`[GameForm] Uploading local image: ${formData.localImage.name}`);
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        });

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          throw new Error(uploadData.error || 'Failed to upload image');
        }

        const uploadResult = await uploadResponse.json();
        
        // Update the image field with just the filename - it will be stored in the /game/ directory
        formData.image = uploadResult.filename;
        console.log(`[GameForm] Image uploaded successfully: ${formData.image}`);
      }

      // Prepare the data
      let gameData = {
        title: formData.title,
        description: formData.description,
        core: formData.core,
        region: formData.region,
        category: formData.category
      };

      // Handle image based on source
      if (formData.imageSource === 'local' && formData.localImage) {
        // For local images, we use the uploaded filename from above
        gameData.image = formData.image;
      } else if (formData.imageSource === 'custom') {
        gameData.image = formData.image;
      } else if (formData.imageSource === 'auto') {
        // Let the server use wikimedia to find an image
        gameData.image = `wikimedia:${encodeURIComponent(formData.title)}:${formData.core}`;
      }
      
      // Handle game file or link
      if (formData.localGame && formData.localGameFileName) {
        // Use the file:// URL directly
        gameData.gameLink = formData.localGameFileName;
      } else {
        gameData.gameLink = formData.gameLink;
      }

      // Handle local (offline) games differently
      if (formData.localGame) {
        // For offline games, we'll use the offline API endpoint
        const response = await fetch('/api/games/offline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gameData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add offline game');
        }

        const offlineGameData = await response.json();
        
        // Save to localStorage under the core name
        try {
          const coreKey = `games_${formData.core}`;
          const existingGames = JSON.parse(localStorage.getItem(coreKey) || '[]');
          
          // Add the new game to the list
          existingGames.push(offlineGameData);
          
          // Save back to localStorage
          localStorage.setItem(coreKey, JSON.stringify(existingGames));
          
          console.log(`[GameForm] Offline game "${offlineGameData.title}" saved to localStorage under ${coreKey}`);
        } catch (storageError) {
          console.error('[GameForm] Error saving to localStorage:', storageError);
          throw new Error('Failed to save offline game to localStorage');
        }
      } else {
        // For online games, use the regular API endpoint with FormData
        const finalFormData = new FormData();
        
        // Add basic text fields
        finalFormData.append('title', formData.title);
        finalFormData.append('description', formData.description);
        finalFormData.append('core', formData.core);
        finalFormData.append('region', formData.region);
        finalFormData.append('categoryId', formData.category.id);
        finalFormData.append('categoryTitle', formData.category.title);
        finalFormData.append('published', 'true');
        
        // Handle image based on source
        if (formData.imageSource === 'local' && formData.localImage) {
          finalFormData.append('coverImage', formData.localImage);
        } else if (formData.imageSource === 'custom') {
          finalFormData.append('imageUrl', formData.image);
        } else if (formData.imageSource === 'auto') {
          // Let the server use wikimedia to find an image
          finalFormData.append('imageUrl', `wikimedia:${encodeURIComponent(formData.title)}:${formData.core}`);
        }
        
        // Add game link
        finalFormData.append('gameLink', formData.gameLink);

        const response = await fetch('/api/games', {
          method: 'POST',
          body: finalFormData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add game');
        }
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setError(error.message);
      console.error('[GameForm] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    
    if (files && files[0]) {
      if (name === 'localImage') {
        // For image file
        const file = files[0];
        
        // Create a temporary object URL to preview the image
        const objectUrl = URL.createObjectURL(file);
        
        // Store the file object and set image source to 'local'
        setFormData(prev => ({
          ...prev,
          localImage: file,
          localImageName: file.name,
          imageSource: 'local'
        }));
        
        // Use the object URL for preview
        setPreviewImage(objectUrl);
        console.log(`[GameForm] Created preview for local image: ${objectUrl}`);
      } else if (name === 'localGameFile') {
        // For ROM file
        const file = files[0];
        
        setFormData(prev => ({
          ...prev,
          localGameFile: file,
          localGameFileName: file.name,
          localGame: true // Auto-select local game when file is chosen
        }));
      }
    }
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    const existingCategory = categories.find(cat => cat.id.toString() === value);
    
    if (existingCategory) {
      setFormData(prev => ({
        ...prev,
        category: { id: existingCategory.id, title: existingCategory.title }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        category: { id: '', title: value }
      }));
    }
  };

  const searchGameCover = async () => {
    if (!formData.title || !formData.core) {
      setSearchError('Please enter a game title and select a core/platform first');
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      // Use Wikimedia image search
      await searchWikimediaImage();
    } catch (err) {
      console.error('[GameForm] Error fetching cover:', err);
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  // Extract image from HTML - Same implementation as in GameImage and Wiki Image Extraction Test
  const extractImageFromHtml = (html) => {
    if (!html) return null;
    
    console.log(`[GameForm] Extracting image from HTML (${html.length} chars)`);
    
    // Try to find the infobox - Same patterns as in Wiki Image Extraction Test
    const infoboxPatterns = [
      /<table class="[^"]*infobox[^"]*vg[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
      /<table class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
      /<table class="[^"]*infobox[^"]*vevent[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
      /<table class="[^"]*infobox[^"]*game[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
      /<table class="[^"]*infobox[^"]*software[^"]*"[^>]*>([\s\S]*?)<\/table>/i
    ];
    
    let infoboxHtml = null;
    for (const pattern of infoboxPatterns) {
      const infoboxMatch = html.match(pattern);
      if (infoboxMatch && infoboxMatch[0]) {
        infoboxHtml = infoboxMatch[0];
        console.log(`[GameForm] Found infobox HTML (${infoboxHtml.length} chars)`);
        break;
      }
    }
    
    if (!infoboxHtml) {
      console.log(`[GameForm] No infobox found in the page`);
      return null;
    }
    
    // Try to find the image in the second row
    const rows = infoboxHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (rows && rows.length >= 2) {
      const imageMatch = rows[1].match(/<img[^>]*src="([^"]*)"[^>]*>/i);
      if (imageMatch && imageMatch[1]) {
        let imageUrl = imageMatch[1];
        if (imageUrl.startsWith('//')) {
          imageUrl = `https:${imageUrl}`;
        }
        console.log(`[GameForm] Found image in second row: ${imageUrl}`);
        return imageUrl;
      }
    }
    
    // If no image in second row, try to find any image in the infobox
    const imageMatch = infoboxHtml.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
    if (imageMatch && imageMatch[1]) {
      let imageUrl = imageMatch[1];
      if (imageUrl.startsWith('//')) {
        imageUrl = `https:${imageUrl}`;
      }
      console.log(`[GameForm] Found image in infobox: ${imageUrl}`);
      return imageUrl;
    }
    
    console.log(`[GameForm] No image found in infobox`);
    return null;
  };

  // Search for Wikimedia image using the same approach as in GameImage
  const searchWikimediaImage = async () => {
    console.log(`[GameForm] Searching Wikimedia for: ${formData.title}`);
    
    // Step 1: First, search for the page to get the exact title
    const searchQuery = `${formData.title} video game`;
    console.log(`[GameForm] Search query: ${searchQuery}`);
    
    const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`);
    
    if (!searchResponse.ok) {
      throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    console.log(`[GameForm] Search results:`, searchData.query ? `Found ${searchData.query.search?.length || 0} results` : 'No results');
    
    if (!searchData.query?.search || searchData.query.search.length === 0) {
      throw new Error('No search results found');
    }
    
    // Get the exact title from the first search result
    const exactTitle = searchData.query.search[0].title;
    console.log(`[GameForm] Found exact title: "${exactTitle}"`);
    
    // Step 2: Now fetch the raw HTML content to extract images
    console.log(`[GameForm] Fetching HTML content for: ${exactTitle}`);
    const contentResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(exactTitle)}&prop=text&format=json&origin=*`);
    
    if (!contentResponse.ok) {
      throw new Error(`Failed to fetch page content: ${contentResponse.status}`);
    }
    
    const contentData = await contentResponse.json();
    if (!contentData.parse?.text?.['*']) {
      throw new Error('No HTML content found');
    }
    
    const htmlContent = contentData.parse.text['*'];
    console.log(`[GameForm] Received HTML content (${htmlContent.length} chars)`);
    
    // Now extract the image from the HTML
    let extractedImageUrl = extractImageFromHtml(htmlContent);
    
    if (extractedImageUrl) {
      console.log(`[GameForm] Successfully extracted image: ${extractedImageUrl}`);
      setPreviewImage(extractedImageUrl);
      setFormData(prev => ({
        ...prev,
        apiImageUrl: extractedImageUrl,
        imageSource: 'auto'
      }));
      return;
    }
    
    // Step 3: If no image found in HTML, try the thumbnail API
    console.log(`[GameForm] No image in HTML, trying thumbnail API for: ${exactTitle}`);
    const thumbnailResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(exactTitle)}&prop=pageimages&format=json&pithumbsize=500&origin=*`);
    
    if (!thumbnailResponse.ok) {
      throw new Error(`Thumbnail API failed: ${thumbnailResponse.status}`);
    }
    
    const thumbnailData = await thumbnailResponse.json();
    const pages = thumbnailData.query?.pages;
    
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const thumbnail = pages[pageId]?.thumbnail?.source;
      
      if (thumbnail) {
        console.log(`[GameForm] Found thumbnail: ${thumbnail}`);
        setPreviewImage(thumbnail);
        setFormData(prev => ({
          ...prev,
          apiImageUrl: thumbnail,
          imageSource: 'auto'
        }));
        return;
      }
    }
    
    throw new Error('No image found for this game');
  };

  const handleImageSourceChange = (source) => {
    setFormData(prev => ({
      ...prev,
      imageSource: source
    }));
    
    // Clear preview if switching to custom URL
    if (source === 'custom') {
      setPreviewImage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {error && <p className="text-red-500">{error}</p>}
      
      {/* Local Game Toggle */}
      <div className="rounded bg-gray-800 p-4 border border-accent-secondary">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="localGame"
            checked={formData.localGame}
            onChange={handleChange}
            className="w-4 h-4 accent-yellow-500"
          />
          <ComputerDesktopIcon className="w-5 h-5 text-yellow-500" />
          <span className="font-medium">This is a local game (from my computer)</span>
        </label>
        <p className="text-xs text-gray-400 mt-2 ml-6">
          Local games will be marked with a badge and no files will be uploaded to the server.
          You will need to manage the ROM files and images yourself.
        </p>
      </div>

      <div>
        <label className="block mb-2">Game Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full p-3 rounded bg-primary border border-accent-secondary"
          required
          placeholder="Enter game title"
        />
      </div>

      <div>
        <label className="block mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-3 rounded bg-primary border border-accent-secondary"
          rows="3"
          placeholder="Game description"
        />
      </div>

      <div>
        <label className="block mb-2 flex justify-between">
          <span>Game Cover Image</span>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleImageSourceChange('custom')}
              className={`px-2 py-1 rounded ${
                formData.imageSource === 'custom'
                  ? 'bg-accent text-black'
                  : 'bg-primary border border-accent'
              }`}
            >
              Custom URL
            </button>
            <button
              type="button"
              onClick={() => handleImageSourceChange('local')}
              className={`px-2 py-1 rounded ${
                formData.imageSource === 'local'
                  ? 'bg-accent text-black'
                  : 'bg-primary border border-accent'
              }`}
            >
              Local File
            </button>
            <button
              type="button"
              onClick={() => handleImageSourceChange('auto')}
              className={`px-2 py-1 rounded ${
                formData.imageSource === 'auto'
                  ? 'bg-accent text-black'
                  : 'bg-primary border border-accent'
              }`}
            >
              Auto Search
            </button>
          </div>
        </label>

        {formData.imageSource === 'custom' && (
          <div>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full p-3 rounded bg-primary border border-accent-secondary"
              placeholder="URL to game cover image"
            />
          </div>
        )}
        
        {formData.imageSource === 'local' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center justify-center w-full h-12 px-4 border border-dashed border-gray-500 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors">
                <PhotoIcon className="w-5 h-5 mr-2" />
                <span className="text-sm">
                  {formData.localImageName ? formData.localImageName : 'Select image file'}
                </span>
                <input
                  type="file"
                  name="localImage"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </div>
            <p className="text-xs text-gray-400">
              Select a local image file for the game cover. Recommended size: 264x352 pixels.
            </p>
          </div>
        )}
        
        {formData.imageSource === 'auto' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={searchGameCover}
                  disabled={searching || !formData.title || !formData.core}
                  className="bg-accent-secondary flex items-center gap-2 px-4 py-2 rounded hover:bg-accent-secondary/80 disabled:opacity-50"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  {searching ? 'Searching...' : 'Search Cover'}
                </button>
                <p className="text-xs text-accent flex items-center">
                  Search for game cover based on title and platform
                </p>
              </div>
            </div>
            
            {searchError && (
              <p className="text-red-500 text-sm">{searchError}</p>
            )}
            
            {formData.apiImageUrl && (
              <p className="text-xs text-accent">
                Using Wikimedia image. The image will be cached in your browser.
              </p>
            )}
          </div>
        )}
        
        {/* Preview Area */}
        <div className="mt-4">
          {(previewImage || formData.image) && (
            <div className="flex flex-col items-center">
              <p className="text-sm mb-2">Preview:</p>
              <div className="w-52 h-72 overflow-hidden border border-accent rounded">
                <Image
                  src={previewImage || formData.image || '/game/default-image.png'}
                  width={208}
                  height={288}
                  alt="Cover preview"
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.target.src = '/game/default-image.png';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block mb-2">Category *</label>
        <div className="flex gap-4">
          <select
            value={formData.category.id}
            onChange={handleCategoryChange}
            className="w-1/2 p-3 rounded bg-primary border border-accent-secondary"
          >
            <option value="">Select or type new category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={formData.category.title}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              category: { id: '', title: e.target.value }
            }))}
            className="w-1/2 p-3 rounded bg-primary border border-accent-secondary"
            placeholder="Or type new category name"
          />
        </div>
      </div>

      {/* Game File Section - Show different UI based on localGame toggle */}
      {formData.localGame ? (
        <div>
          <label className="block mb-2">Local Game File *</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-center w-full h-12 px-4 border border-dashed border-gray-500 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors">
              <ComputerDesktopIcon className="w-5 h-5 mr-2" />
              <span className="text-sm">
                {formData.localGameFileName ? formData.localGameFileName : 'Select ROM file'}
              </span>
              <input
                type="file"
                name="localGameFile"
                onChange={handleFileChange}
                className="hidden"
                required={formData.localGame}
              />
            </label>
            <p className="text-xs text-gray-400">
              Select your local ROM file. This will be referenced but not uploaded.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <label className="block mb-2">Game ROM URL *</label>
          <input
            type="text"
            name="gameLink"
            value={formData.gameLink}
            onChange={handleChange}
            className="w-full p-3 rounded bg-primary border border-accent-secondary"
            required={!formData.localGame}
            placeholder="URL to game ROM file"
          />
        </div>
      )}

      <div>
        <label className="block mb-2">Emulator Core *</label>
        <div className="flex gap-4">
          <select
            name="core"
            value={formData.core}
            onChange={handleChange}
            className="w-1/2 p-3 rounded bg-primary border border-accent-secondary"
            required
          >
            <option value="">Select a core</option>
            
            {/* Nintendo Systems */}
            <optgroup label="Nintendo">
              <option value="nes">NES</option>
              <option value="snes">SNES</option>
              <option value="n64">Nintendo 64</option>
              <option value="gb">Game Boy</option>
              <option value="gbc">Game Boy Color</option>
              <option value="gba">Game Boy Advance</option>
              <option value="nds">Nintendo DS</option>
            </optgroup>
            
            {/* Sega Systems */}
            <optgroup label="Sega">
              <option value="segaMS">Master System</option>
              <option value="segaMD">Mega Drive (Genesis)</option>
              <option value="segaCD">Sega CD</option>
              <option value="segaGG">Game Gear</option>
              <option value="sega32x">32X</option>
              <option value="saturn">Saturn</option>
            </optgroup>
            
            {/* Sony Systems */}
            <optgroup label="Sony">
              <option value="psx">PlayStation</option>
              <option value="psp">PSP</option>
            </optgroup>
            
            {/* Other Systems */}
            <optgroup label="Other">
              <option value="arcade">Arcade</option>
              <option value="atari2600">Atari 2600</option>
              <option value="lynx">Atari Lynx</option>
              <option value="pc">DOS</option>
              <option value="3do">3DO</option>
              <option value="jaguar">Jaguar</option>
              <option value="neogeo">Neo Geo</option>
              <option value="coleco">ColecoVision</option>
            </optgroup>
          </select>
          <input
            type="text"
            name="core"
            value={formData.core}
            onChange={handleChange}
            className="w-1/2 p-3 rounded bg-primary border border-accent-secondary"
            placeholder="Or type custom core"
          />
        </div>
      </div>

      <div>
        <label className="block mb-2">Region</label>
        <select
          name="region"
          value={formData.region}
          onChange={handleChange}
          className="w-full p-3 rounded bg-primary border border-accent-secondary"
        >
          <option value="">Not specified (default to US)</option>
          <option value="us">USA (North America)</option>
          <option value="jp">Japan</option>
          <option value="eu">Europe</option>
          <option value="world">World</option>
          <option value="other">Other</option>
        </select>
        <p className="text-xs text-accent mt-1">
          Select the region/version of this game. If not specified, it will default to US for searches.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent text-black p-3 rounded-xl font-medium hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Adding Game...' : 'Submit Game'}
      </button>
    </form>
  );
}