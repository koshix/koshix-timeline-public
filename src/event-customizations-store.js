import {
  createVersionedRecord,
  decodeVersionedRecord,
} from "./versioned-storage.js";

const DB_NAME = "koshix-timeline-customizations";
const DB_VERSION = 1;
const STORE_NAME = "customizations";
const CUSTOMIZATIONS_KEY = "event-customizations";

export const EVENT_CUSTOMIZATIONS_STORAGE_FORMAT =
  "koshix-timeline-event-customizations";
export const EVENT_CUSTOMIZATIONS_STORAGE_VERSION = 1;

export const EMPTY_EVENT_CUSTOMIZATIONS = {
  overrides: {},
  hidden: [],
  additions: [],
};

function requireIndexedDb() {
  if (
    typeof window === "undefined" ||
    typeof window.indexedDB === "undefined"
  ) {
    throw new Error(
      "このブラウザでは年表カスタマイズのブラウザ保存を利用できません"
    );
  }

  return window.indexedDB;
}

function validateCustomizations(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "ブラウザ内の年表カスタマイズデータ形式が不正です"
    );
  }

  const overrides = value.overrides ?? {};
  const hidden = value.hidden ?? [];
  const additions = value.additions ?? [];

  if (
    !overrides ||
    typeof overrides !== "object" ||
    Array.isArray(overrides)
  ) {
    throw new Error(
      "ブラウザ内の年表カスタマイズ overrides が不正です"
    );
  }

  if (!Array.isArray(hidden)) {
    throw new Error(
      "ブラウザ内の年表カスタマイズ hidden が不正です"
    );
  }

  if (!Array.isArray(additions)) {
    throw new Error(
      "ブラウザ内の年表カスタマイズ additions が不正です"
    );
  }

  return {
    overrides,
    hidden,
    additions,
  };
}

export function encodeEventCustomizationsStorageValue(
  customizations
) {
  return createVersionedRecord(
    EVENT_CUSTOMIZATIONS_STORAGE_FORMAT,
    EVENT_CUSTOMIZATIONS_STORAGE_VERSION,
    validateCustomizations(customizations)
  );
}

export function decodeEventCustomizationsStorageValue(value) {
  return decodeVersionedRecord(value, {
    format: EVENT_CUSTOMIZATIONS_STORAGE_FORMAT,
    currentVersion: EVENT_CUSTOMIZATIONS_STORAGE_VERSION,
    validateData: validateCustomizations,
    context: "年表カスタマイズ保存データ",
  });
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
          new Error(
            "年表カスタマイズ保存用データベースを開けませんでした"
          )
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
              new Error(
                "年表カスタマイズデータの読み書きに失敗しました"
              )
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

export async function loadBrowserEventCustomizations() {
  const value = await runTransaction(
    "readonly",
    (store) => store.get(CUSTOMIZATIONS_KEY)
  );

  if (value === undefined) {
    return {
      overrides: {},
      hidden: [],
      additions: [],
    };
  }

  return decodeEventCustomizationsStorageValue(value).data;
}

export async function saveBrowserEventCustomizations(
  customizations
) {
  const value = encodeEventCustomizationsStorageValue(
    customizations
  );

  await runTransaction(
    "readwrite",
    (store) => store.put(value, CUSTOMIZATIONS_KEY)
  );
}

export async function clearBrowserEventCustomizations() {
  await runTransaction(
    "readwrite",
    (store) => store.delete(CUSTOMIZATIONS_KEY)
  );
}
