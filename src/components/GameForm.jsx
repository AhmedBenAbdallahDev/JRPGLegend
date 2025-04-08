'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function GameForm({ categories = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    imageSource: 'custom', // 'custom', 'tgdb', or 'screenscraper'
    apiImageUrl: '',
    gameLink: '',
    core: '',
    region: '', // Empty string instead of 'us' default
    category: { id: '', title: '' }
  });

  // State for API search
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [selectedApiSource, setSelectedApiSource] = useState('wikimedia');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // If using API image, update the image field to the special format
      const finalFormData = {
        ...formData,
        published: true
      };

      if (formData.imageSource === 'tgdb' && formData.apiImageUrl) {
        // Format: "tgdb:GameTitle:core"
        finalFormData.image = `tgdb:${encodeURIComponent(formData.title)}:${formData.core}`;
      } else if (formData.imageSource === 'screenscraper' && formData.apiImageUrl) {
        // Format: "screenscraper:GameTitle:core"
        finalFormData.image = `screenscraper:${encodeURIComponent(formData.title)}:${formData.core}`;
      }

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add game');
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      if (selectedApiSource === 'wikimedia') {
        // Use direct Wikimedia extraction like in GameImage
        await searchWikimediaImage();
      } else {
        console.log(`[GameForm] ${selectedApiSource} API not directly implemented yet, using Wikimedia instead`);
        await searchWikimediaImage();
      }
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
    
    // Extract the image from the HTML
    let imageUrl = extractImageFromHtml(htmlContent);
    
    if (imageUrl) {
      console.log(`[GameForm] Successfully extracted image: ${imageUrl}`);
      setFormData(prev => ({
        ...prev,
        apiImageUrl: imageUrl,
        imageSource: 'wikimedia'
      }));
      setPreviewImage(imageUrl);
      return;
    }
    
    // Step 3: If no image found in HTML, try the thumbnail API
    console.log(`[GameForm] No image in HTML, trying thumbnail API for: ${exactTitle}`);
    const thumbnailResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(exactTitle)}&prop=pageimages&format=json&pithumbsize=500&origin=*`);
    
    if (thumbnailResponse.ok) {
      const thumbnailData = await thumbnailResponse.json();
      const pages = thumbnailData.query?.pages;
      
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const thumbnail = pages[pageId]?.thumbnail?.source;
        
        if (thumbnail) {
          console.log(`[GameForm] Found thumbnail: ${thumbnail}`);
          setFormData(prev => ({
            ...prev,
            apiImageUrl: thumbnail,
            imageSource: 'wikimedia'
          }));
          setPreviewImage(thumbnail);
          return;
        }
      }
    }
    
    throw new Error('No image found for this game');
  };

  const handleImageSourceChange = (source) => {
    setFormData(prev => ({
      ...prev,
      imageSource: source
    }));
    
    // Update preview based on selected source
    if (source === 'tgdb' || source === 'screenscraper') {
      setPreviewImage(formData.apiImageUrl);
    } else {
      setPreviewImage(formData.image || '');
    }
  };

  // When title or core changes, reset the API image
  useEffect(() => {
    if (formData.imageSource !== 'custom') {
      setFormData(prev => ({
        ...prev,
        apiImageUrl: ''
      }));
      setPreviewImage('');
    }
  }, [formData.title, formData.core]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded">
          {error}
        </div>
      )}

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
              onClick={() => handleImageSourceChange('tgdb')}
              className={`px-2 py-1 rounded ${
                formData.imageSource === 'tgdb'
                  ? 'bg-accent text-black'
                  : 'bg-primary border border-accent'
              }`}
            >
              TheGamesDB
            </button>
            <button
              type="button"
              onClick={() => handleImageSourceChange('screenscraper')}
              className={`px-2 py-1 rounded ${
                formData.imageSource === 'screenscraper'
                  ? 'bg-accent text-black'
                  : 'bg-primary border border-accent'
              }`}
            >
              ScreenScraper
            </button>
          </div>
        </label>

        {formData.imageSource === 'custom' ? (
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
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center mb-2">
                <label className="block text-sm">API Source:</label>
                <select
                  value={selectedApiSource}
                  onChange={(e) => setSelectedApiSource(e.target.value)}
                  className="p-2 rounded bg-primary border border-accent-secondary"
                >
                  <option value="wikimedia">Wikimedia (recommended)</option>
                  <option value="tgdb">TheGamesDB (coming soon)</option>
                  <option value="screenscraper">ScreenScraper (coming soon)</option>
                </select>
              </div>
              
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
                Using {selectedApiSource === 'tgdb' ? 'TheGamesDB' : 'ScreenScraper'} image. 
                No bandwidth used on your server! Image will be cached in the browser.
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

      <div>
        <label className="block mb-2">Game ROM URL *</label>
        <input
          type="text"
          name="gameLink"
          value={formData.gameLink}
          onChange={handleChange}
          className="w-full p-3 rounded bg-primary border border-accent-secondary"
          required
          placeholder="URL to game ROM file"
        />
      </div>

      <div>
        <label className="block mb-2">Emulator Core *</label>
        <div className="flex gap-4">
          <select
            name="core"
            value={formData.core}
            onChange={handleChange}
            className="w-1/2 p-3 rounded bg-primary border border-accent-secondary"
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
              <option value="segaMD">Sega Genesis/Mega Drive</option>
              <option value="segaCD">Sega CD</option>
              <option value="segaSaturn">Sega Saturn</option>
            </optgroup>
            
            {/* Sony Systems */}
            <optgroup label="Sony">
              <option value="psx">PlayStation</option>
              <option value="psp">PlayStation Portable</option>
            </optgroup>
            
            {/* Other Systems */}
            <optgroup label="Other">
              <option value="arcade">Arcade</option>
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