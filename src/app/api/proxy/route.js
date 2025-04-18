export async function GET(request) {
  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing URL parameter', { status: 400 });
    }

    const decodedUrl = decodeURIComponent(targetUrl);
    
    // Check if this is an image URL that should be cached
    const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(decodedUrl);
    
    // Create default headers
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    
    // Add cache control directives for images
    if (isImage) {
      defaultHeaders['Cache-Control'] = 'public, max-age=31536000, immutable';
    }
    
    const response = await fetch(decodedUrl, {
      headers: defaultHeaders
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type');

    // Create headers with very permissive CORS
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': '*',
      'Access-Control-Allow-Private-Network': 'true',
      'Access-Control-Max-Age': '86400',
      'Content-Type': contentType || 'application/octet-stream'
    });
    
    // Add cache control based on content type
    if (isImage || contentType?.includes('image/')) {
      // Strongly cache images for 1 year
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Pragma', 'cache');
      headers.set('Expires', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString());
    } else {
      // Cache other resources for 7 days
      headers.set('Cache-Control', 'public, max-age=604800');
    }

    return new Response(arrayBuffer, { headers });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400'
    }
  });
}
