import { NextResponse } from 'next/server';
import { searchGame } from '@/lib/screenscraper';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const core = searchParams.get('core');

    if (!name || !core) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: name and core'
      }, { status: 400 });
    }

    // Get platform ID mapping
    const platformsResponse = await fetch(new URL('/api/screenscraper/platforms', request.url));
    const platformsData = await platformsResponse.json();
    
    if (!platformsData.success) {
      throw new Error('Failed to fetch platform mappings');
    }
    
    const platform = platformsData.platforms.find(p => p.id === core);
    if (!platform) {
      return NextResponse.json({
        success: false,
        error: `Unsupported platform: ${core}`
      }, { status: 400 });
    }

    const gameData = await searchGame(name, platform.platformId);
    
    return NextResponse.json({
      success: true,
      gameData
    });
  } catch (error) {
    console.error('Error in ScreenScraper API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch game data'
    }, { status: error.status || 500 });
  }
}

// Function to check API status
async function checkApiStatus() {
  try {
    // Get API credentials from environment variables
    const devId = process.env.SCREENSCRAPER_DEV_ID;
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD;
    const user = process.env.SCREENSCRAPER_USER;
    const password = process.env.SCREENSCRAPER_PASSWORD;
    const softname = process.env.SCREENSCRAPER_SOFTNAME || 'JRPGLegend';

    // Validate credentials
    if (!devId || !devPassword || !user || !password) {
      return NextResponse.json({
        success: false,
        message: 'Missing ScreenScraper API credentials in environment variables',
        credentials: {
          hasDevId: !!devId,
          hasDevPassword: !!devPassword,
          hasUser: !!user,
          hasPassword: !!password
        }
      });
    }

    // Get platform ID for NES
    const platformId = getPlatformId('nes');

    // Construct the API URL for a simple test
    const apiUrl = `https://www.screenscraper.fr/api2/gameInfo.php?devid=${devId}&devpassword=${devPassword}&softname=${encodeURIComponent(softname)}&ssid=${user}&sspassword=${password}&game=Super%20Mario%20Bros&systemeid=${platformId}`;

    console.log(`[ScreenScraper] Testing API with URL: ${apiUrl.replace(devPassword, 'REDACTED').replace(password, 'REDACTED')}`);

    // Fetch data from ScreenScraper API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `ScreenScraper API responded with status: ${response.status}`
      });
    }

    const data = await response.json();

    // Check if the API returned an error
    if (data.response && data.response.status !== 'success') {
      return NextResponse.json({
        success: false,
        message: data.response.message || 'ScreenScraper API returned an error',
        credentials: {
          user,
          hasPassword: !!password
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'ScreenScraper API is working correctly',
      credentials: {
        user,
        hasPassword: !!password
      }
    });
  } catch (error) {
    console.error('Error checking ScreenScraper API status:', error);
    return NextResponse.json({
      success: false,
      message: `Error checking ScreenScraper API status: ${error.message}`
    });
  }
} 