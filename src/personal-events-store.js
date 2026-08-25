const DB_NAME = "koshix-timeline";
const DB_VERSION = 1;
const STORE_NAME = "personal-history";
const EVENTS_KEY = "events";

function requireIndexedDb() {
  if (
    typeof window === "undefined" ||
    typeof window.indexedDB === "undefined"
  ) {
    throw new Error(
      "このブラウザでは個人史のブラウザ保存を利用できません"
    );
  }

  return window.indexedDB;
}

function openDatabase() {
  const indexedDb = requireIndexedDb();

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error("個人史保存用データベースを開けませんでした")
      );
    };
  });
}

function runTransaction(mode, operation) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);

        let request;

        try {
          request = operation(store);
        } catch (err) {
          db.close();
          reject(err);
          return;
        }

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(
            request.error ||
              new Error("個人史データの読み書きに失敗しました")
          );
        };

        tx.oncomplete = () => {
          db.close();
        };

        tx.onerror = () => {
          db.close();
        };

        tx.onabort = () => {
          db.close();
        };
      })
  );
}

export async function loadBrowserPersonalEvents() {
  const value = await runTransaction(
    "readonly",
    (store) => store.get(EVENTS_KEY)
  );

  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error("ブラウザ内の個人史データ形式が不正です");
  }

  return value;
}

export async function saveBrowserPersonalEvents(events) {
  if (!Array.isArray(events)) {
    throw new Error("保存する個人史データが配列ではありません");
  }

  await runTransaction(
    "readwrite",
    (store) => store.put(events, EVENTS_KEY)
  );
}

export async function clearBrowserPersonalEvents() {
  await runTransaction(
    "readwrite",
    (store) => store.delete(EVENTS_KEY)
  );
}
