import { checkApiStatus } from '@/lib/thegamesdb';
import { NextResponse } from 'next/server';

/**
 * API endpoint to check TheGamesDB API status
 */
export async function GET() {
  try {
    const status = await checkApiStatus();
    
    return NextResponse.json({
      available: status.available,
      message: status.message,
      platformsCount: status.platforms,
      apiKey: process.env.TGDB_API_KEY ? 'Set in env' : 'Using default'
    });
  } catch (error) {
    console.error('Error checking TheGamesDB API status:', error);
    
    return NextResponse.json(
      { available: false, error: error.message },
      { status: 500 }
    );
  }
} 