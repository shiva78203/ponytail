/**
 * Tellonym client for fetching anonymous messages
 */

const BASE_URL = "https://tellonym.me/api";

let authToken = null;

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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
}

/**
 * Fetch Tellonym messages for a given user ID
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
    throw new Error(`Error fetching Tellonym messages: ${error.message}`);
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

export { getMessages, getMessage, getMessageStats, setAuthToken };
