import { NextResponse } from 'next/server';

/**
 * This API route is no longer used as we're handling Wikimedia image extraction
 * directly in the GameImage component using the same approach as Wiki Image Extraction Test
 */
export async function GET(request) {
  return NextResponse.json({
    success: false,
    error: 'This API route is deprecated. Wikimedia extraction is now handled directly in the GameImage component.'
  }, { status: 410 }); // 410 Gone
} 