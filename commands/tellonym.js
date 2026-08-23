#!/usr/bin/env node
/**
 * CLI command to fetch Tellonym messages
 * Usage: node commands/tellonym.js <user-id> [--limit N] [--offset N]
 */

import { getMessages, getMessage, getMessageStats } from "../lib/tellonym-client.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  const userId = args[0];
  const options = parseOptions(args.slice(1));

  try {
    if (options.stats) {
      const stats = await getMessageStats(userId);
      console.log(JSON.stringify(stats, null, 2));
    } else if (options.messageId) {
      const message = await getMessage(options.messageId);
      console.log(JSON.stringify(message, null, 2));
    } else {
      const messages = await getMessages(userId, {
        limit: options.limit,
        offset: options.offset,
      });

      console.log(
        JSON.stringify(
          {
            userId,
            count: messages.length,
            messages,
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

function parseOptions(args) {
  const options = {
    limit: 50,
    offset: 0,
    stats: false,
    messageId: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--limit" && i + 1 < args.length) {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === "--offset" && i + 1 < args.length) {
      options.offset = parseInt(args[++i], 10);
    } else if (arg === "--stats") {
      options.stats = true;
    } else if (arg === "--message-id" && i + 1 < args.length) {
      options.messageId = args[++i];
    }
  }

  return options;
}

function printUsage() {
  console.log(`
Tellonym Message Fetcher

Usage:
  node commands/tellonym.js <user-id> [options]

Options:
  --limit N           Maximum number of messages to fetch (default: 50)
  --offset N          Offset for pagination (default: 0)
  --stats             Get message statistics instead of messages
  --message-id ID     Get a specific message by ID
  --help, -h          Show this help message

Examples:
  # Fetch first 50 messages for user ID 123
  node commands/tellonym.js 123

  # Fetch 20 messages starting at offset 50
  node commands/tellonym.js 123 --limit 20 --offset 50

  # Get statistics for user
  node commands/tellonym.js 123 --stats

  # Get a specific message
  node commands/tellonym.js --message-id abc123
`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { getMessages, getMessage, getMessageStats };
