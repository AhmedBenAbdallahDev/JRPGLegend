/**
 * Vercel API route for fetching game cover images from Wikipedia
 */

// CORS headers for the API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }
  
  // Set CORS headers for all responses
  setCorsHeaders(res);
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { game } = req.query;
  
  if (!game) {
    return res.status(400).json({ error: 'Missing game parameter' });
  }
  
  try {
    // Make request to the internal API endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const apiUrl = `${baseUrl}/api/wikipedia/cover?game=${encodeURIComponent(game)}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Set cache headers (7 days)
    res.setHeader('Cache-Control', 'public, max-age=604800');
    
    // Return the result
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Wikipedia cover API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch game cover from Wikipedia' 
    });
  }
}

function setCorsHeaders(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
} 