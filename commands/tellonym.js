#!/usr/bin/env node
/**
 * CLI command to fetch Tellonym messages
 * Usage: node commands/tellonym.js <user-id> [--limit N] [--scrape] [--token TOKEN]
 */

import {
  getMessages,
  getMessage,
  getMessageStats,
  getMessagesViaScraping,
  setAuthToken,
  generateDemoMessages,
} from "../lib/tellonym-client.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  const userId = args[0];
  const options = parseOptions(args.slice(1));

  // Set auth token if provided
  if (options.token) {
    setAuthToken(options.token);
  }

  try {
    // Demo mode for testing
    if (options.demo) {
      const messages = generateDemoMessages(options.limit);
      console.log(
        JSON.stringify(
          {
            userId,
            method: "Demo (Sample Data)",
            count: messages.length,
            messages,
            note: "This is demo data for testing. Use real user ID with authentication for actual messages.",
          },
          null,
          2
        )
      );
      return;
    }

    if (options.stats) {
      const stats = await getMessageStats(userId);
      console.log(JSON.stringify(stats, null, 2));
    } else if (options.messageId) {
      const message = await getMessage(options.messageId);
      console.log(JSON.stringify(message, null, 2));
    } else {
      let messages = [];
      let method = "API";

      try {
        // Try API first unless scrape mode is explicitly requested
        if (!options.scrape) {
          messages = await getMessages(userId, {
            limit: options.limit,
            offset: options.offset,
          });
        } else {
          throw new Error("Scraping mode requested");
        }
      } catch (apiError) {
        // Fallback to scraping if API fails
        if (options.scrape || options.fallback) {
          console.error(`[INFO] API failed, trying web scraping...`);
          messages = await getMessagesViaScraping(userId, {
            limit: options.limit,
          });
          method = "Web Scraping";
        } else {
          throw apiError;
        }
      }

      console.log(
        JSON.stringify(
          {
            userId,
            method,
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
    scrape: false,
    demo: false,
    fallback: true, // Auto-fallback to scraping by default
    token: process.env.TELLONYM_AUTH_TOKEN || process.env.TELLONYM_API_KEY,
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
    } else if (arg === "--scrape" || arg === "-s") {
      options.scrape = true;
      options.fallback = false;
    } else if (arg === "--demo") {
      options.demo = true;
    } else if (arg === "--token" && i + 1 < args.length) {
      options.token = args[++i];
    } else if (arg === "--no-fallback") {
      options.fallback = false;
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
  --scrape, -s        Use web scraping instead of API
  --demo              Generate demo/sample messages (for testing)
  --token TOKEN       Set authentication token (or use TELLONYM_AUTH_TOKEN env var)
  --no-fallback       Don't fallback to scraping if API fails
  --help, -h          Show this help message

Environment Variables:
  TELLONYM_AUTH_TOKEN  API authentication token
  TELLONYM_API_KEY     Alternative API key variable name

Examples:
  # View demo data (no authentication needed)
  node commands/tellonym.js user.4920576 --demo

  # Fetch first 50 messages using API (auto-fallback to scraping)
  node commands/tellonym.js user.4920576

  # Fetch using web scraping
  node commands/tellonym.js user.4920576 --scrape

  # Fetch 20 messages with custom token
  node commands/tellonym.js user.4920576 --limit 20 --token abc123xyz

  # Fetch without fallback (fail if API unavailable)
  node commands/tellonym.js user.4920576 --no-fallback

  # Get statistics for user
  node commands/tellonym.js user.4920576 --stats

  # Get a specific message
  node commands/tellonym.js --message-id abc123

  # Using environment variable for auth
  TELLONYM_AUTH_TOKEN=your_token node commands/tellonym.js user.4920576
`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { getMessages, getMessage, getMessageStats, getMessagesViaScraping };
