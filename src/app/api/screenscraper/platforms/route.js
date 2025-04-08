import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromApi = searchParams.get('fromApi') === 'true';
    
    if (fromApi) {
      // Fetch platforms directly from ScreenScraper API
      const devId = process.env.SCREENSCRAPER_DEV_ID;
      const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD;
      const user = process.env.SCREENSCRAPER_USER;
      const password = process.env.SCREENSCRAPER_PASSWORD;
      const softname = process.env.SCREENSCRAPER_SOFTNAME || 'JRPGLegend';

      if (!devId || !devPassword || !user || !password) {
        throw new Error('Missing ScreenScraper API credentials');
      }

      const apiUrl = `https://www.screenscraper.fr/api2/systemesListe.php?devid=${devId}&devpassword=${devPassword}&softname=${encodeURIComponent(softname)}&ssid=${user}&sspassword=${password}&output=json`;
      
      console.log(`[ScreenScraper] Fetching platforms list`);
      const response = await fetch(apiUrl, { timeout: 10000 });
      
      if (!response.ok) {
        throw new Error(`ScreenScraper API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error || 'ScreenScraper API returned an error');
      }
      
      // Process the response to extract platforms
      if (!data.response || !data.response.systemes) {
        throw new Error('No platform data found in API response');
      }
      
      // Map API response to our format
      const apiPlatforms = data.response.systemes.map(system => ({
        id: system.shortname ? system.shortname.toLowerCase() : `id_${system.id}`,
        name: system.nom || `System ${system.id}`,
        platformId: parseInt(system.id, 10),
        // Add additional details
        company: system.compagnie?.text || '',
        type: system.type || '',
        romtype: system.romtype || '',
        icon: system.icone || '',
        extensions: system.romext || '',
        year: system.datedebut?.text || ''
      }));
      
      return NextResponse.json({
        success: true,
        platforms: apiPlatforms,
        source: 'api'
      });
    } else {
      // Fallback to local platform mapping if API fetch not requested
      // Platform IDs are from ScreenScraper documentation
      const platforms = [
        // Nintendo Systems - Consoles
        { id: 'nes', name: 'Nintendo Entertainment System (NES)', platformId: 3 },
        { id: 'famicom', name: 'Famicom', platformId: 106 },
        { id: 'famicom_disk', name: 'Famicom Disk System', platformId: 105 },
        { id: 'snes', name: 'Super Nintendo (SNES)', platformId: 4 },
        { id: 'sfc', name: 'Super Famicom', platformId: 107 },
        { id: 'n64', name: 'Nintendo 64', platformId: 14 },
        { id: 'n64dd', name: 'Nintendo 64DD', platformId: 134 },
        { id: 'gamecube', name: 'Nintendo GameCube', platformId: 13 },
        { id: 'wii', name: 'Nintendo Wii', platformId: 16 },
        { id: 'wiiu', name: 'Nintendo Wii U', platformId: 18 },
        { id: 'switch', name: 'Nintendo Switch', platformId: 225 },
        { id: 'virtualboy', name: 'Virtual Boy', platformId: 11 },
        
        // Nintendo Systems - Handhelds
        { id: 'gb', name: 'Game Boy', platformId: 9 },
        { id: 'gbc', name: 'Game Boy Color', platformId: 10 },
        { id: 'gba', name: 'Game Boy Advance', platformId: 12 },
        { id: 'nds', name: 'Nintendo DS', platformId: 15 },
        { id: 'dsi', name: 'Nintendo DSi', platformId: 163 },
        { id: '3ds', name: 'Nintendo 3DS', platformId: 17 },
        { id: 'pokemini', name: 'Pokemon mini', platformId: 211 },
        
        // Sega Systems
        { id: 'genesis', name: 'Sega Genesis/Mega Drive', platformId: 1 },
        { id: 'megadrive', name: 'Sega Mega Drive (EU/JP)', platformId: 1 },
        { id: 'sg1000', name: 'Sega SG-1000', platformId: 109 },
        { id: 'segacd', name: 'Sega CD / Mega CD', platformId: 20 },
        { id: '32x', name: 'Sega 32X', platformId: 19 },
        { id: 'saturn', name: 'Sega Saturn', platformId: 22 },
        { id: 'dreamcast', name: 'Sega Dreamcast', platformId: 23 },
        { id: 'gamegear', name: 'Sega Game Gear', platformId: 21 },
        { id: 'mastersystem', name: 'Sega Master System', platformId: 2 },
        { id: 'pico', name: 'Sega Pico', platformId: 173 },
        
        // Sony Systems
        { id: 'psx', name: 'PlayStation', platformId: 57 },
        { id: 'ps2', name: 'PlayStation 2', platformId: 58 },
        { id: 'ps3', name: 'PlayStation 3', platformId: 59 },
        { id: 'ps4', name: 'PlayStation 4', platformId: 60 },
        { id: 'ps5', name: 'PlayStation 5', platformId: 227 },
        { id: 'psp', name: 'PlayStation Portable', platformId: 61 },
        { id: 'psvita', name: 'PlayStation Vita', platformId: 62 },
        { id: 'pocketstation', name: 'PocketStation', platformId: 151 },
        
        // Microsoft Systems
        { id: 'xbox', name: 'Xbox', platformId: 32 },
        { id: 'xbox360', name: 'Xbox 360', platformId: 33 },
        { id: 'xboxone', name: 'Xbox One', platformId: 34 },
        { id: 'xboxseriesx', name: 'Xbox Series X', platformId: 229 },
        
        // Classic arcade/console systems
        { id: 'arcade', name: 'Arcade', platformId: 75 },
        { id: 'neogeo', name: 'Neo Geo', platformId: 142 },
        { id: 'neogeocd', name: 'Neo Geo CD', platformId: 70 },
        { id: 'ngp', name: 'Neo Geo Pocket', platformId: 81 },
        { id: 'ngpc', name: 'Neo Geo Pocket Color', platformId: 82 },
        { id: 'pcengine', name: 'PC Engine/TurboGrafx-16', platformId: 31 },
        { id: 'pcenginecd', name: 'PC Engine CD/TurboGrafx-CD', platformId: 32 },
        { id: 'wonderswan', name: 'WonderSwan', platformId: 45 },
        { id: 'wonderswancolor', name: 'WonderSwan Color', platformId: 46 },
        { id: 'supergrafx', name: 'SuperGrafx', platformId: 105 },
        
        // Atari Systems (keeping just the most popular ones)
        { id: 'atari2600', name: 'Atari 2600', platformId: 25 },
        { id: 'atari5200', name: 'Atari 5200', platformId: 26 },
        { id: 'atari7800', name: 'Atari 7800', platformId: 27 },
        { id: 'lynx', name: 'Atari Lynx', platformId: 28 },
        { id: 'jaguar', name: 'Atari Jaguar', platformId: 29 },
        { id: 'jaguarcd', name: 'Atari Jaguar CD', platformId: 171 }
      ];
      
      return NextResponse.json({
        success: true,
        platforms,
        source: 'local'
      });
    }
  } catch (error) {
    console.error('Error in platforms endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get platforms'
    }, { status: 500 });
  }
} 