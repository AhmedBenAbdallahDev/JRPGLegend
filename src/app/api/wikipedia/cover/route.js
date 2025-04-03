import { NextResponse } from 'next/server';
import { getGameCoverFromWikipedia } from '@/lib/wikipedia';

/**
 * API route to get a game cover image directly from Wikipedia
 * 
 * @param {Request} request - The incoming request
 * @returns {NextResponse} - The API response
 */
export async function GET(request) {
  const url = new URL(request.url);
  const game = url.searchParams.get('game');
  
  if (!game) {
    return NextResponse.json(
      { error: 'Missing game parameter' },
      { status: 400 }
    );
  }
  
  try {
    const result = await getGameCoverFromWikipedia(game);
    
    if (!result) {
      return NextResponse.json(
        { error: 'No cover found' },
        { status: 404 }
      );
    }
    
    // Add cache headers
    const headers = new Headers();
    const cacheTime = 60 * 60 * 24 * 7; // 7 days
    headers.append('Cache-Control', `public, max-age=${cacheTime}`);
    
    // Add expiration date for client-side use
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + cacheTime);
    
    return NextResponse.json(
      { 
        ...result,
        cached: true,
        cacheControl: `public, max-age=${cacheTime}`,
        expiresAt: expiresAt.toISOString()
      },
      { 
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('Wikipedia cover API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cover from Wikipedia' },
      { status: 500 }
    );
  }
} 