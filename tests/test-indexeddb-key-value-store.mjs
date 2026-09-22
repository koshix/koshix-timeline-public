import assert from "node:assert/strict";

import {
  createIndexedDbKeyValueStore,
} from "../src/indexeddb-key-value-store.js";

function createIndexedDbHarness() {
  let transaction = null;
  let closed = false;
  let resolveRequestSucceeded;

  const requestSucceeded = new Promise(
    (resolve) => {
      resolveRequestSucceeded = resolve;
    }
  );

  const operation = () => {
    const request = {};

    queueMicrotask(() => {
      request.result = "stored-value";
      request.onsuccess?.();
      resolveRequestSucceeded();
    });

    return request;
  };

  const indexedDB = {
    open() {
      const openRequest = {};

      queueMicrotask(() => {
        const db = {
          objectStoreNames: {
            contains: () => true,
          },

          transaction() {
            transaction = {
              error: null,

              objectStore() {
                return {
                  get: operation,
                  put: operation,
                  delete: operation,
                };
              },

              oncomplete: null,
              onerror: null,
              onabort: null,
            };

            return transaction;
          },

          close() {
            closed = true;
          },
        };

        openRequest.result = db;
        openRequest.onsuccess?.();
      });

      return openRequest;
    },
  };

  return {
    indexedDB,
    requestSucceeded,
    get transaction() {
      return transaction;
    },
    get closed() {
      return closed;
    },
  };
}

const originalWindow = globalThis.window;

try {
  const completeHarness =
    createIndexedDbHarness();

  globalThis.window = {
    indexedDB: completeHarness.indexedDB,
  };

  const completeStore =
    createIndexedDbKeyValueStore({
      dbName: "test-complete",
      storeName: "store",
      unavailableMessage: "unavailable",
      openErrorMessage: "open failed",
      operationErrorMessage:
        "operation failed",
    });

  let resolved = false;

  const pendingGet = completeStore
    .get("key")
    .then((value) => {
      resolved = true;
      return value;
    });

  await completeHarness.requestSucceeded;
  await Promise.resolve();

  assert.equal(
    resolved,
    false,
    "request success must not resolve before transaction commit"
  );

  completeHarness.transaction.oncomplete();

  assert.equal(
    await pendingGet,
    "stored-value"
  );
  assert.equal(
    completeHarness.closed,
    true
  );

  const abortHarness =
    createIndexedDbHarness();

  globalThis.window = {
    indexedDB: abortHarness.indexedDB,
  };

  const abortStore =
    createIndexedDbKeyValueStore({
      dbName: "test-abort",
      storeName: "store",
      unavailableMessage: "unavailable",
      openErrorMessage: "open failed",
      operationErrorMessage:
        "operation failed",
    });

  const pendingPut = abortStore.put(
    "value",
    "key"
  );

  await abortHarness.requestSucceeded;

  const rejection = assert.rejects(
    pendingPut,
    /commit failed/
  );

  abortHarness.transaction.error =
    new Error("commit failed");
  abortHarness.transaction.onabort();

  await rejection;

  assert.equal(
    abortHarness.closed,
    true
  );
} finally {
  if (originalWindow === undefined) {
    delete globalThis.window;
  } else {
    globalThis.window = originalWindow;
  }
}

console.log(
  "OK: IndexedDB operations wait for transaction completion"
);
