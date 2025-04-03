import { NextResponse } from 'next/server';
import { getWikipediaImages } from '@/lib/wikipedia';

/**
 * API route to get images from a Wikipedia page
 * 
 * @param {Request} request - The incoming request
 * @returns {NextResponse} - The API response
 */
export async function GET(request) {
  const url = new URL(request.url);
  const title = url.searchParams.get('title');
  
  if (!title) {
    return NextResponse.json(
      { error: 'Missing title parameter' },
      { status: 400 }
    );
  }
  
  try {
    const { images, page } = await getWikipediaImages(title);
    
    // Add cache headers
    const headers = new Headers();
    const cacheTime = 60 * 60 * 24; // 24 hours
    headers.append('Cache-Control', `public, max-age=${cacheTime}`);
    
    return NextResponse.json(
      { images, page },
      { 
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('Wikipedia images API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Wikipedia images' },
      { status: 500 }
    );
  }
} 