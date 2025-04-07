# Wikimedia API Integration

This integration allows JRPGLegend to fetch game cover images directly from Wikimedia as an alternative source when TheGamesDB or ScreenScraper are unavailable or don't have the requested game.

## Features

- **High-quality authenticated API**: Uses the official Wikimedia REST API v1
- **Higher rate limits**: 5000 requests per hour with authenticated access
- **High resolution images**: Retrieves optimized cover art thumbnails
- **Metadata enrichment**: Provides game descriptions and page links alongside images
- **Caching**: Implements 7-day caching for efficient performance
- **Fallback option**: Can be used as a backup when primary sources fail

## API Authentication

The integration uses OAuth 2.0 authentication with the Wikimedia API. Credentials are stored in environment variables:

```
WIKIMEDIA_CLIENT_ID=your_client_id
WIKIMEDIA_AUTH_TOKEN=your_access_token
```

### Set Up Environment Variables

1. Create a `.env.local` file in the root of your project if it doesn't already exist
2. Add the Wikimedia API credentials to the file:
   ```
   WIKIMEDIA_CLIENT_ID=your_client_id
   WIKIMEDIA_AUTH_TOKEN=your_access_token
   ```
3. Make sure `.env.local` is in your `.gitignore` file to prevent committing secrets

> **Important**: Never commit API credentials to version control. The `.env.local` file should always be in your `.gitignore`.

## API Usage

### Internal API (`/api/wikipedia/cover`)

```js
// Example: Fetch a cover image for "Final Fantasy VII"
const response = await fetch('/api/wikipedia/cover?game=Final+Fantasy+VII');
const data = await response.json();

// Response contains:
// {
//   coverUrl: "https://upload.wikimedia.org/wikipedia/en/c/c2/Final_Fantasy_VII_Box_Art.jpg",
//   title: "Final Fantasy VII",
//   source: "wikimedia",
//   pageUrl: "https://en.wikipedia.org/wiki/Final_Fantasy_VII",
//   extract: "Final Fantasy VII is a 1997 role-playing video game...",
//   cached: true,
//   expiresAt: "2023-05-15T12:34:56.789Z"
// }
```

### Vercel Serverless Function (`/api/wikipedia-cover`)

An external API endpoint is also available for serverless deployment, intended for use from other domains:

```js
// Example
const coverUrl = `https://your-vercel-domain.vercel.app/api/wikipedia-cover?game=Final+Fantasy+VII`;
```

## Implementation Details

The Wikimedia integration uses the official REST API v1:

1. Search for the game title + "video game" using the `/search/page` endpoint
2. Retrieve the thumbnail image using the `/page/{title}/thumbnail` endpoint
3. Get the page description using the `/page/{title}/summary` endpoint
4. Return the data with proper caching headers

## Error Handling

The API provides clear error messages for different scenarios:
- Missing game parameter (400)
- No Wikipedia page found (404)
- No cover image on the page (404)
- API errors (returns the status code from Wikimedia)
- Internal errors (500)

## Integration with EnhancedGameCover

To use Wikimedia as a fallback source in the EnhancedGameCover component, add it to the source options:

```jsx
<EnhancedGameCover 
  gameTitle="Final Fantasy VII"
  preferredSource="wikimedia" // or use as fallback
  // other props
/>
```

## Deployment Considerations

When deploying to production, make sure to set the environment variables:

1. For Vercel: Add the environment variables in the Vercel dashboard
2. For other platforms: Follow their documentation for setting environment variables

## Test Page

A test page is available at `/wikipedia-test` that provides a simple interface to search for game covers from Wikimedia. This page demonstrates the full capabilities of the Wikimedia API integration.

## API Documentation

For more information on the Wikimedia API, see the official documentation:
- https://api.wikimedia.org/wiki/Main_Page
- https://api.wikimedia.org/wiki/Core_REST_API/Reference 