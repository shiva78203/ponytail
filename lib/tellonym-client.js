/**
 * Tellonym client for fetching anonymous messages
 */

const BASE_URL = "https://api.tellonym.me";

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
    const url = new URL(`${BASE_URL}/api/user/${userId}/messages`);
    url.searchParams.append("limit", limit);
    url.searchParams.append("offset", offset);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Ponytail-Tellonym-Client/1.0",
      },
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
    const url = `${BASE_URL}/api/message/${messageId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Ponytail-Tellonym-Client/1.0",
      },
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
    const url = `${BASE_URL}/api/user/${userId}/stats`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Ponytail-Tellonym-Client/1.0",
      },
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

export { getMessages, getMessage, getMessageStats };
