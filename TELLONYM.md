# Tellonym Integration

This document describes the Tellonym integration for fetching anonymous messages.

## Overview

The Tellonym integration provides a command-line tool and library for fetching anonymous messages from Tellonym users.

## Installation

The Tellonym client is included in the Ponytail package. No additional dependencies are required.

## Usage

### Command Line

```bash
# Fetch messages for a user
node commands/tellonym.js <user-id>

# Fetch with custom limit and offset
node commands/tellonym.js <user-id> --limit 20 --offset 10

# Get user statistics
node commands/tellonym.js <user-id> --stats

# Get a specific message
node commands/tellonym.js --message-id <message-id>
```

### Library

```javascript
import { getMessages, getMessage, getMessageStats } from './lib/tellonym-client.js';

// Fetch messages for a user
const messages = await getMessages('123', { limit: 50, offset: 0 });
console.log(messages);

// Get a specific message
const message = await getMessage('msg-id');
console.log(message);

// Get user statistics
const stats = await getMessageStats('123');
console.log(stats);
```

## API Reference

### `getMessages(userId, options)`

Fetch messages for a given Tellonym user.

**Parameters:**
- `userId` (string|number): The Tellonym user ID
- `options` (object, optional):
  - `limit` (number): Maximum number of messages (default: 50)
  - `offset` (number): Pagination offset (default: 0)

**Returns:** Promise<Array> - Array of message objects

**Example:**
```javascript
const messages = await getMessages('user123', { limit: 20 });
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
const stats = await getMessageStats('user123');
```

## Error Handling

All functions throw errors if the API request fails. It's recommended to wrap calls in try-catch blocks:

```javascript
try {
  const messages = await getMessages('123');
} catch (error) {
  console.error('Failed to fetch messages:', error.message);
}
```

## Testing

Run tests with:
```bash
npm test
```

## Environment Requirements

- Node.js 16+
- Internet connection (for API calls)
