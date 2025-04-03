# Wikipedia API Integration for Game Covers

## Overview

This integration allows JRPG Legend to retrieve game cover images and information from Wikipedia as an additional source, providing more reliable game cover availability when other APIs fail.

## Features

- **Free API Access**: Unlike TheGamesDB and ScreenScraper, Wikipedia's API does not require authentication or have strict rate limits
- **Rich Metadata**: Returns game titles, descriptions (extracts), and links to the Wikipedia pages
- **Fallback Option**: Used as a fallback when TheGamesDB and ScreenScraper APIs fail
- **Direct API Endpoint**: Can be used directly via `/api/wikipedia-cover.js` Vercel function

## API Endpoints

### Internal Next.js API Routes

- `/api/wikipedia/search`: Search for game pages on Wikipedia
- `/api/wikipedia/images`: Get images from a specific Wikipedia page
- `/api/wikipedia/cover`: Get a cover image for a game (most common use case)

### Serverless Vercel Function

- `/api/wikipedia-cover`: Standalone API that can be called from external sites

## Usage Examples

### Frontend:

```javascript
// Direct cover fetch
const getCover = async (gameName) => {
  const response = await fetch(`/api/wikipedia/cover?game=${encodeURIComponent(gameName)}`);
  const data = await response.json();
  return data;
}

// Search and then get images
const searchAndGetImages = async (gameName) => {
  // Step 1: Search
  const searchResponse = await fetch(`/api/wikipedia/search?query=${encodeURIComponent(gameName)}`);
  const searchData = await searchResponse.json();
  
  if (searchData.results && searchData.results.length > 0) {
    // Step 2: Get images from the first result
    const title = searchData.results[0].title;
    const imagesResponse = await fetch(`/api/wikipedia/images?title=${encodeURIComponent(title)}`);
    return await imagesResponse.json();
  }
  
  return null;
}
```

### External API call:

```javascript
// Call from any external site or application
const getGameCover = async (gameName) => {
  const response = await fetch(`https://yoursite.com/api/wikipedia-cover?game=${encodeURIComponent(gameName)}`);
  const data = await response.json();
  return data.coverUrl;
}
```

## Implementation Details

The Wikipedia integration uses three main API endpoints from Wikipedia:

1. **Search API**: Finds the most relevant Wikipedia page for a game
2. **Page Info API**: Gets the basic information including the main thumbnail
3. **Image Info API**: Retrieves details about images on the page

The implementation uses a smart fallback strategy to ensure maximum cover image availability:

1. First tries ScreenScraper if available
2. Falls back to TheGamesDB if ScreenScraper fails
3. Finally tries Wikipedia if both other sources fail

## Caching

- API responses are cached for 24 hours (search, images) or 7 days (cover)
- Client-side caching in localStorage for improved performance
- CDN caching headers for efficient delivery

## Notes

- Wikipedia doesn't have dedicated game cover databases, so results might sometimes return game screenshots or logos instead of box art
- The API prioritizes the main page thumbnail which is typically the box art for game pages
- For older or less popular games, Wikipedia coverage may be limited 