import { checkApiStatus } from '@/lib/screenscraper';
import { NextResponse } from 'next/server';

/**
 * API Route for checking ScreenScraper API status
 */
export async function GET() {
  try {
    const status = await checkApiStatus();
    
    return NextResponse.json({
      available: status.available,
      message: status.message,
      credentials: {
        user: !!process.env.SCREENSCRAPER_USER,
        hasPassword: !!process.env.SCREENSCRAPER_PASSWORD,
        devId: !!process.env.SCREENSCRAPER_DEV_ID,
        hasDevPassword: !!process.env.SCREENSCRAPER_DEV_PASSWORD
      },
      gameFound: status.gameFound
    });
  } catch (error) {
    console.error('Error checking ScreenScraper API status:', error);
    
    return NextResponse.json({
      available: false,
      message: error.message || 'Error checking API status',
    }, { status: 500 });
  }
} 