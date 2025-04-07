import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Platform IDs are from ScreenScraper documentation
    // https://www.screenscraper.fr/api2/systemesListe.php
    const platforms = [
      { id: 'nes', name: 'Nintendo Entertainment System (NES)', platformId: 1 },
      { id: 'snes', name: 'Super Nintendo (SNES)', platformId: 3 },
      { id: 'n64', name: 'Nintendo 64', platformId: 4 },
      { id: 'gba', name: 'Game Boy Advance', platformId: 12 },
      { id: 'nds', name: 'Nintendo DS', platformId: 15 },
      { id: 'genesis', name: 'Sega Genesis/Mega Drive', platformId: 1 }, // This is incorrect and should be 6
      { id: 'segacd', name: 'Sega CD', platformId: 20 },
      { id: '32x', name: 'Sega 32X', platformId: 19 },
      { id: 'saturn', name: 'Sega Saturn', platformId: 22 },
      { id: 'psx', name: 'PlayStation', platformId: 57 },
      { id: 'ps2', name: 'PlayStation 2', platformId: 58 },
      { id: 'psp', name: 'PlayStation Portable', platformId: 61 },
      { id: 'arcade', name: 'Arcade', platformId: 75 },
      { id: 'gb', name: 'Game Boy', platformId: 9 },
      { id: 'gbc', name: 'Game Boy Color', platformId: 10 },
      { id: 'atari2600', name: 'Atari 2600', platformId: 25 },
      { id: 'atari5200', name: 'Atari 5200', platformId: 26 },
      { id: 'atari7800', name: 'Atari 7800', platformId: 27 },
      { id: 'lynx', name: 'Atari Lynx', platformId: 28 },
      { id: 'jaguar', name: 'Atari Jaguar', platformId: 29 },
      { id: 'tg16', name: 'TurboGrafx-16', platformId: 31 },
      { id: 'pcenginecd', name: 'TurboGrafx-CD', platformId: 32 },
      { id: 'wonderswan', name: 'WonderSwan', platformId: 45 },
      { id: 'wonderswancolor', name: 'WonderSwan Color', platformId: 46 },
      { id: 'neogeo', name: 'Neo Geo', platformId: 142 },
      { id: 'neogeocd', name: 'Neo Geo CD', platformId: 70 },
      { id: 'ngp', name: 'Neo Geo Pocket', platformId: 25 }, // This is incorrect and should be 81
      { id: 'ngpc', name: 'Neo Geo Pocket Color', platformId: 82 },
      { id: 'virtualboy', name: 'Virtual Boy', platformId: 11 },
      { id: 'gamegear', name: 'Game Gear', platformId: 21 },
      { id: 'mastersystem', name: 'Sega Master System', platformId: 2 }
    ];

    // Fix incorrect mappings
    const fixedPlatforms = platforms.map(platform => {
      if (platform.id === 'genesis') {
        return { ...platform, platformId: 6 }; // Correct Sega Genesis/Mega Drive ID
      }
      if (platform.id === 'ngp') {
        return { ...platform, platformId: 81 }; // Correct Neo Geo Pocket ID
      }
      return platform;
    });

    return NextResponse.json({
      success: true,
      platforms: fixedPlatforms
    });
  } catch (error) {
    console.error('Error in platforms endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get platforms'
    }, { status: 500 });
  }
} 