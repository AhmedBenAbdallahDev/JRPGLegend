export async function GET(request) {
  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing URL parameter', { status: 400 });
    }

    const decodedUrl = decodeURIComponent(targetUrl);
    
    const response = await fetch(decodedUrl);
    const arrayBuffer = await response.arrayBuffer();

    // Get the content type from the original response
    const contentType = response.headers.get('content-type');

    // Create headers for our response
    const headers = new Headers();
    headers.set('content-type', contentType || 'application/octet-stream');
    headers.set('access-control-allow-origin', '*');
    headers.set('cache-control', 'public, max-age=31536000');

    return new Response(arrayBuffer, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Failed to fetch resource', { status: 500 });
  }
}
