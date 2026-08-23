/**
 * Tellonym client for fetching anonymous messages via API and web scraping
 */

const BASE_URL = "https://tellonym.me/api";
const TELLONYM_WEB_URL = "https://tellonym.me";

let authToken = null;

/**
 * Get authentication token from parameter or environment variable
 * @returns {string|null} Auth token if available
 */
function getAuthToken() {
  if (authToken) return authToken;
  return process.env.TELLONYM_AUTH_TOKEN || process.env.TELLONYM_API_KEY || null;
}

/**
 * Generate mock/demo messages for testing
 * @param {number} count - Number of demo messages to generate
 * @returns {Array} Array of demo message objects
 */
function generateDemoMessages(count = 10) {
  const sampleMessages = [
    "That's so cool! 😊",
    "You're amazing!",
    "Keep being awesome!",
    "This made my day",
    "You inspire me!",
    "Great work! 👏",
    "Love your energy",
    "You're so talented",
    "Appreciate you so much",
    "Keep shining ⭐",
  ];

  const messages = [];
  for (let i = 0; i < count; i++) {
    messages.push({
      id: `msg-${Date.now()}-${i}`,
      content: sampleMessages[i % sampleMessages.length],
      createdAt: new Date(
        Date.now() - i * 86400000
      ).toISOString(),
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      anonymous: true,
    });
  }
  return messages;
}

/**
 * Set authentication token for API requests
 * @param {string} token - Bearer token for authentication
 */
function setAuthToken(token) {
  authToken = token;
}

/**
 * Build headers for API requests
 * @returns {object} Headers object
 */
function buildHeaders() {
  const headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Origin: TELLONYM_WEB_URL,
    Referer: `${TELLONYM_WEB_URL}/`,
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetch Tellonym messages for a given user ID via API
 * @param {string|number} userId - The Tellonym user ID
 * @param {object} options - Optional configuration
 * @param {number} options.limit - Maximum number of messages to fetch (default: 50)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @returns {Promise<Array>} Array of message objects
 */
async function getMessages(userId, options = {}) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const limit = options.limit || 50;
  const offset = options.offset || 0;

  try {
    const url = new URL(`${BASE_URL}/user/${userId}/messages`);
    url.searchParams.append("limit", limit);
    url.searchParams.append("offset", offset);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: buildHeaders(),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          "API access forbidden. Try scraping mode or provide valid authentication via TELLONYM_AUTH_TOKEN environment variable."
        );
      }
      throw new Error(
        `Failed to fetch messages: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.messages)) {
      return [];
    }

    return data.messages;
  } catch (error) {
    throw new Error(`Error fetching Tellonym messages via API: ${error.message}`);
  }
}

/**
 * Scrape Tellonym messages for a user from their public profile
 * @param {string} userId - The Tellonym user ID or username
 * @param {object} options - Optional configuration
 * @param {number} options.limit - Maximum number of messages to scrape (default: 50)
 * @param {object} options.cookies - Session cookies if available
 * @returns {Promise<Array>} Array of message objects extracted from HTML
 */
async function getMessagesViaScraping(userId, options = {}) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const limit = options.limit || 50;
  const cookies = options.cookies || "";

  try {
    // Try different endpoint variations
    const endpoints = [
      `${TELLONYM_WEB_URL}/${userId}`,
      `${TELLONYM_WEB_URL}/user/${userId}`,
      `${TELLONYM_WEB_URL}/@${userId}`,
    ];

    let lastError = null;
    let html = null;

    for (const profileUrl of endpoints) {
      try {
        const response = await fetch(profileUrl, {
          method: "GET",
          headers: buildScrapingHeaders(cookies),
          redirect: "follow",
        });

        if (response.ok) {
          html = await response.text();
          break;
        } else if (response.status !== 403 && response.status !== 404) {
          lastError = new Error(
            `${response.status} ${response.statusText} at ${profileUrl}`
          );
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!html) {
      throw lastError || new Error("Could not access any valid profile endpoint");
    }

    // Extract messages from HTML
    const messages = parseMessagesFromHTML(html, limit);

    return messages;
  } catch (error) {
    throw new Error(
      `Error scraping Tellonym messages: ${error.message}`
    );
  }
}

/**
 * Build headers for web scraping that mimic a real browser
 * @param {string} cookies - Session cookies
 * @returns {object} Headers object
 */
function buildScrapingHeaders(cookies = "") {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Cache-Control": "max-age=0",
    DNT: "1",
  };

  if (cookies) {
    headers.Cookie = cookies;
  }

  return headers;
}

/**
 * Parse messages from HTML content
 * @param {string} html - HTML content
 * @param {number} limit - Maximum messages to extract
 * @returns {Array} Extracted messages
 */
function parseMessagesFromHTML(html, limit) {
  const messages = [];

  try {
    // Try to extract JSON data from Next.js __NEXT_DATA__ script tag
    const nextDataMatch = html.match(
      /<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/
    );

    if (nextDataMatch) {
      const jsonData = JSON.parse(nextDataMatch[1]);

      // Navigate the Next.js data structure to find messages
      const props =
        jsonData?.props?.pageProps?.initialState?.messages?.data || [];

      if (Array.isArray(props)) {
        return props.slice(0, limit).map((msg) => ({
          id: msg.id,
          content: msg.content || msg.text,
          createdAt: msg.createdAt || msg.timestamp,
          author: msg.author,
          likes: msg.likes || 0,
          comments: msg.comments || 0,
        }));
      }
    }

    // Fallback: try to extract from meta tags or data attributes
    const messageRegex =
      /data-message-id="([^"]*)"[^>]*>([^<]*)<\/div>/g;
    let match;

    while ((match = messageRegex.exec(html)) && messages.length < limit) {
      messages.push({
        id: match[1],
        content: match[2],
        createdAt: new Date().toISOString(),
      });
    }

    // If still no messages, try to find them in JSON-LD structured data
    if (messages.length === 0) {
      const jsonLdMatch = html.match(
        /<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g
      );

      if (jsonLdMatch) {
        jsonLdMatch.forEach((match) => {
          const jsonStr = match.replace(
            /<script[^>]*type="application\/ld\+json"[^>]*>/,
            ""
          );
          const cleaned = jsonStr.replace(/<\/script>/, "");
          try {
            const data = JSON.parse(cleaned);
            if (data.itemListElement && Array.isArray(data.itemListElement)) {
              data.itemListElement.slice(0, limit).forEach((item) => {
                messages.push({
                  id: item.position || Math.random().toString(36),
                  content: item.name || item.description,
                  createdAt: item.datePublished || new Date().toISOString(),
                });
              });
            }
          } catch {
            // Skip invalid JSON
          }
        });
      }
    }

    return messages.slice(0, limit);
  } catch (error) {
    console.error("Error parsing HTML:", error.message);
    return [];
  }
}

/**
 * Fetch a single message by ID
 * @param {string|number} messageId - The message ID
 * @returns {Promise<Object>} Message object
 */
async function getMessage(messageId) {
  if (!messageId) {
    throw new Error("Message ID is required");
  }

  try {
    const url = `${BASE_URL}/message/${messageId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch message: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching Tellonym message: ${error.message}`);
  }
}

/**
 * Get messages statistics for a user
 * @param {string|number} userId - The Tellonym user ID
 * @returns {Promise<Object>} Statistics object
 */
async function getMessageStats(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const url = `${BASE_URL}/user/${userId}/stats`;
    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch stats: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching Tellonym stats: ${error.message}`);
  }
}

export {
  getMessages,
  getMessage,
  getMessageStats,
  getMessagesViaScraping,
  setAuthToken,
  generateDemoMessages,
};
