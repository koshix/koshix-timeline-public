export function createIndexedDbKeyValueStore({
  dbName,
  dbVersion = 1,
  storeName,
  unavailableMessage,
  openErrorMessage,
  operationErrorMessage,
}) {
  function requireIndexedDb() {
    if (
      typeof window === "undefined" ||
      typeof window.indexedDB === "undefined"
    ) {
      throw new Error(unavailableMessage);
    }

    return window.indexedDB;
  }

  function openDatabase() {
    const indexedDb = requireIndexedDb();

    return new Promise((resolve, reject) => {
      const request = indexedDb.open(
        dbName,
        dbVersion
      );

      request.onupgradeneeded = () => {
        const db = request.result;

        if (
          !db.objectStoreNames.contains(
            storeName
          )
        ) {
          db.createObjectStore(storeName);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(
          request.error ||
            new Error(openErrorMessage)
        );
      };
    });
  }

  function runTransaction(mode, operation) {
    return openDatabase().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(
            storeName,
            mode
          );
          const store =
            tx.objectStore(storeName);

          let request;
          let requestResult;
          let settled = false;

          const fail = (error) => {
            if (settled) return;

            settled = true;
            db.close();

            reject(
              error ||
                new Error(
                  operationErrorMessage
                )
            );
          };

          try {
            request = operation(store);
          } catch (err) {
            fail(err);
            return;
          }

          request.onsuccess = () => {
            requestResult = request.result;
          };

          request.onerror = () => {
            fail(
              request.error ||
                new Error(
                  operationErrorMessage
                )
            );
          };

          tx.oncomplete = () => {
            if (settled) return;

            settled = true;
            db.close();
            resolve(requestResult);
          };

          tx.onerror = () => {
            fail(
              tx.error ||
                request?.error ||
                new Error(
                  operationErrorMessage
                )
            );
          };

          tx.onabort = () => {
            fail(
              tx.error ||
                request?.error ||
                new Error(
                  operationErrorMessage
                )
            );
          };
        })
    );
  }

  return {
    get(key) {
      return runTransaction(
        "readonly",
        (store) => store.get(key)
      );
    },

    put(value, key) {
      return runTransaction(
        "readwrite",
        (store) => store.put(value, key)
      );
    },

    delete(key) {
      return runTransaction(
        "readwrite",
        (store) => store.delete(key)
      );
    },
  };
}
