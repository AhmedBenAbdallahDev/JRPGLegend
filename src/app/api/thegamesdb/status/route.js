import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TGDB_API_KEY;
  
  return NextResponse.json({
    available: !!apiKey,
    message: apiKey 
      ? 'TheGamesDB API key is configured' 
      : 'TheGamesDB API key is not configured. The system will fall back to ScreenScraper API.'
  });
} 