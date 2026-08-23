# Tellonym Integration

This document describes the Tellonym integration for fetching anonymous messages.

## Overview

The Tellonym integration provides a command-line tool and library for fetching anonymous messages from Tellonym users. It supports multiple methods:
- **API access** (requires authentication)
- **Web scraping** (for public profiles)
- **Demo mode** (sample data for testing)

## Installation

The Tellonym client is included in the Ponytail package. No additional dependencies are required.

## Quick Start

### Demo Mode (No Authentication Required)
```bash
# View sample messages
node commands/tellonym.js user.4920576 --demo
```

### With Real Data (Requires Authentication)
```bash
# Set authentication token
export TELLONYM_AUTH_TOKEN=your_token_here

# Fetch messages
node commands/tellonym.js user.4920576
```

## Usage

### Command Line

#### Demo/Testing
```bash
# Generate sample messages for testing
node commands/tellonym.js user.4920576 --demo

# Generate 20 demo messages
node commands/tellonym.js user.4920576 --demo --limit 20
```

#### API Access (Default)
```bash
# Fetch messages for a user (auto-fallback to scraping on failure)
node commands/tellonym.js user.4920576

# Fetch with custom limit
node commands/tellonym.js user.4920576 --limit 20

# Fetch with pagination
node commands/tellonym.js user.4920576 --limit 20 --offset 40

# With custom authentication token
node commands/tellonym.js user.4920576 --token your_api_token

# Without fallback (fail if API unavailable)
node commands/tellonym.js user.4920576 --no-fallback
```

#### Web Scraping
```bash
# Force web scraping mode
node commands/tellonym.js user.4920576 --scrape

# Scrape with custom limit
node commands/tellonym.js user.4920576 --scrape --limit 20
```

#### User Statistics
```bash
# Get user statistics
node commands/tellonym.js user.4920576 --stats
```

### Library Usage

```javascript
import { 
  getMessages, 
  getMessage, 
  getMessageStats, 
  getMessagesViaScraping,
  setAuthToken,
  generateDemoMessages 
} from './lib/tellonym-client.js';

// Set authentication token
setAuthToken('your_api_token');

// Fetch messages via API
const messages = await getMessages('user.4920576', { limit: 50, offset: 0 });
console.log(messages);

// Scrape messages from public profile
const scraped = await getMessagesViaScraping('user.4920576', { limit: 20 });
console.log(scraped);

// Get demo data for testing
const demo = generateDemoMessages(10);
console.log(demo);

// Get a specific message
const message = await getMessage('msg-id');
console.log(message);

// Get user statistics
const stats = await getMessageStats('user.4920576');
console.log(stats);
```

## Environment Variables

Configure authentication via environment variables:

```bash
# Primary authentication token
export TELLONYM_AUTH_TOKEN=your_token_here

# OR alternative key name
export TELLONYM_API_KEY=your_token_here
```

## API Reference

### `getMessages(userId, options)`

Fetch messages for a given Tellonym user via API.

**Parameters:**
- `userId` (string|number): The Tellonym user ID
- `options` (object, optional):
  - `limit` (number): Maximum number of messages (default: 50)
  - `offset` (number): Pagination offset (default: 0)

**Returns:** Promise<Array> - Array of message objects

**Throws:** Error if API request fails (403 Forbidden if auth required)

**Example:**
```javascript
const messages = await getMessages('user.4920576', { limit: 20 });
```

### `getMessagesViaScraping(userId, options)`

Fetch messages from a public Tellonym profile using web scraping.

**Parameters:**
- `userId` (string|number): The Tellonym user ID or username
- `options` (object, optional):
  - `limit` (number): Maximum number of messages to scrape (default: 50)
  - `cookies` (string): Session cookies if available

**Returns:** Promise<Array> - Array of message objects

**Note:** Requires the profile to be publicly accessible

**Example:**
```javascript
const messages = await getMessagesViaScraping('user.4920576', { limit: 20 });
```

### `getMessage(messageId)`

Fetch a single message by ID.

**Parameters:**
- `messageId` (string|number): The message ID

**Returns:** Promise<Object> - Message object

**Example:**
```javascript
const message = await getMessage('msg-id-123');
```

### `getMessageStats(userId)`

Get statistics for a user's messages.

**Parameters:**
- `userId` (string|number): The Tellonym user ID

**Returns:** Promise<Object> - Statistics object

**Example:**
```javascript
const stats = await getMessageStats('user.4920576');
```

### `setAuthToken(token)`

Set authentication token for API requests.

**Parameters:**
- `token` (string): Bearer token or API key

**Example:**
```javascript
setAuthToken('your_api_token');
```

### `generateDemoMessages(count)`

Generate sample messages for testing and development.

**Parameters:**
- `count` (number): Number of demo messages to generate (default: 10)

**Returns:** Array - Array of demo message objects

**Example:**
```javascript
const demo = generateDemoMessages(20);
```

## Message Object Structure

```javascript
{
  id: "msg-123456",
  content: "Your message here",
  createdAt: "2026-08-23T20:31:22.719Z",
  likes: 44,
  comments: 11,
  anonymous: true
}
```

## Authentication

### Getting an Auth Token

1. Log in to Tellonym at https://tellonym.me
2. Open browser DevTools (F12)
3. Go to Network tab and refresh
4. Look for API requests to `tellonym.me/api`
5. Check the `Authorization` header for your Bearer token

### Setting Auth Token

```bash
# Via environment variable
export TELLONYM_AUTH_TOKEN=your_token

# Via command line
node commands/tellonym.js user.4920576 --token your_token

# In code
import { setAuthToken } from './lib/tellonym-client.js';
setAuthToken('your_token');
```

## Error Handling

All functions throw errors if requests fail. It's recommended to wrap calls in try-catch blocks:

```javascript
try {
  const messages = await getMessages('user.4920576');
} catch (error) {
  if (error.message.includes('403')) {
    console.error('Authentication required');
  } else {
    console.error('Failed to fetch messages:', error.message);
  }
}
```

## Testing

Run tests with:
```bash
npm test
```

## Troubleshooting

### API Returns 403 Forbidden
- **Cause:** Missing or invalid authentication token
- **Solution:** Obtain a valid Bearer token from Tellonym and set via `--token` or `TELLONYM_AUTH_TOKEN`

### Scraping Returns 403
- **Cause:** Profile is private or request is being blocked
- **Solution:** Try with API authentication instead, or check if profile is public

### No Messages Found
- **Cause:** User has no public messages or profile doesn't exist
- **Solution:** Verify the user ID is correct and the profile is public

## Requirements

- Node.js 16+
- Internet connection (for API calls and scraping)
- Valid Tellonym user ID (format: `user.XXXXXXX` or username)

## Limitations

- API access requires authentication token
- Scraping only works for public profiles
- Rate limiting may apply to both API and scraping
- Some data may not be available without authentication
