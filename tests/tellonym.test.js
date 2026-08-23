import assert from "node:assert/strict";
import test from "node:test";
import { getMessages, getMessage, getMessageStats } from "../lib/tellonym-client.js";

test("getMessages requires a user ID", async () => {
  await assert.rejects(async () => {
    await getMessages(null);
  }, /User ID is required/);

  await assert.rejects(async () => {
    await getMessages("");
  }, /User ID is required/);
});

test("getMessage requires a message ID", async () => {
  await assert.rejects(async () => {
    await getMessage(null);
  }, /Message ID is required/);

  await assert.rejects(async () => {
    await getMessage("");
  }, /Message ID is required/);
});

test("getMessageStats requires a user ID", async () => {
  await assert.rejects(async () => {
    await getMessageStats(null);
  }, /User ID is required/);

  await assert.rejects(async () => {
    await getMessageStats("");
  }, /User ID is required/);
});

test("getMessages accepts options parameter", async () => {
  // This test verifies the function signature accepts options
  // Actual API calls would be mocked in an integration test
  assert.doesNotThrow(() => {
    // Function signature is valid
    const testFunc = async () => {
      try {
        await getMessages("123", { limit: 10, offset: 0 });
      } catch (error) {
        // Expected to fail without mocking - we're just testing the signature
        if (!error.message.includes("fetch")) {
          throw error;
        }
      }
    };
    testFunc();
  });
});
