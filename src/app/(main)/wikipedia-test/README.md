# Wikipedia Cover Image Integration

This integration allows JRPGLegend to fetch game cover images directly from Wikipedia as an alternative source when TheGamesDB or ScreenScraper are unavailable or don't have the requested game.

## Features

- **Free without rate limits**: Uses the Wikipedia public API which has no authentication requirements
- **High quality images**: Retrieves high-resolution cover art (1000px) when available
- **Metadata enrichment**: Provides game descriptions and page links alongside images
- **Caching**: Implements 7-day caching for efficient performance
- **Fallback option**: Can be used as a backup when primary sources fail

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
//   source: "wikipedia",
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

The Wikipedia integration works in the following way:

1. Search for the game title + "video game" on Wikipedia
2. Select the first matching result
3. Fetch page details including thumbnail image, description, and links
4. Return the data with proper caching headers

## Error Handling

The API provides clear error messages for different scenarios:
- Missing game parameter (400)
- No Wikipedia page found (404)
- No cover image on the page (404)
- API errors (returns the status code from Wikipedia)
- Internal errors (500)

## Integration with EnhancedGameCover

To use Wikipedia as a fallback source in the EnhancedGameCover component, add it to the source options:

```jsx
<EnhancedGameCover 
  gameTitle="Final Fantasy VII"
  preferredSource="wikipedia" // or use as fallback
  // other props
/>
```

## Test Page

A test page is available at `/wikipedia-test` that provides a simple interface to search for game covers from Wikipedia. This page demonstrates the full capabilities of the Wikipedia integration. 