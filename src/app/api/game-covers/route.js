import { NextResponse } from 'next/server';

/**
 * DEPRECATED: This API endpoint is no longer used.
 * Image extraction is now handled directly in the components.
 */
export async function GET(request) {
  return NextResponse.json({
    success: false,
    error: 'This API endpoint is deprecated. Image extraction is now handled directly in the components.',
    status: 'DEPRECATED'
  }, { status: 410 }); // 410 Gone status code
} 