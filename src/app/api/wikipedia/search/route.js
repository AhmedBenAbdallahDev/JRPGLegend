import { NextResponse } from 'next/server';
import { searchWikipedia } from '@/lib/wikipedia';

/**
 * API route to search for games on Wikipedia
 * 
 * @param {Request} request - The incoming request
 * @returns {NextResponse} - The API response
 */
export async function GET(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query');
  
  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 }
    );
  }
  
  try {
    const results = await searchWikipedia(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Wikipedia search API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search Wikipedia' },
      { status: 500 }
    );
  }
} 