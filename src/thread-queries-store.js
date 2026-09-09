import {
  createVersionedRecord,
  decodeVersionedRecord,
} from "./versioned-storage.js";

import {
  createIndexedDbKeyValueStore,
} from "./indexeddb-key-value-store.js";

const DB_NAME =
  "koshix-timeline-thread-queries";
const DB_VERSION = 1;
const STORE_NAME = "thread-queries";
const QUERIES_KEY = "queries";

export const THREAD_QUERIES_STORAGE_FORMAT =
  "koshix-timeline-thread-queries";
export const THREAD_QUERIES_STORAGE_VERSION = 1;

function validateThreadQueries(value) {
  if (
    !Array.isArray(value) ||
    value.some(
      (query) => typeof query !== "string"
    )
  ) {
    throw new Error(
      "ブラウザ内のたどるキーワードデータ形式が不正です"
    );
  }

  return [
    ...new Set(
      value
        .map((query) => query.trim())
        .filter(Boolean)
    ),
  ];
}

export function encodeThreadQueriesStorageValue(
  queries
) {
  return createVersionedRecord(
    THREAD_QUERIES_STORAGE_FORMAT,
    THREAD_QUERIES_STORAGE_VERSION,
    validateThreadQueries(queries)
  );
}

export function decodeThreadQueriesStorageValue(
  value
) {
  return decodeVersionedRecord(value, {
    format: THREAD_QUERIES_STORAGE_FORMAT,
    currentVersion: THREAD_QUERIES_STORAGE_VERSION,
    validateData: validateThreadQueries,
    context: "たどるキーワード保存データ",
  });
}

const threadQueriesBrowserStore =
  createIndexedDbKeyValueStore({
    dbName: DB_NAME,
    dbVersion: DB_VERSION,
    storeName: STORE_NAME,
    unavailableMessage:
      "このブラウザではたどるキーワードのブラウザ保存を利用できません",
    openErrorMessage:
      "たどるキーワード保存用データベースを開けませんでした",
    operationErrorMessage:
      "たどるキーワードの読み書きに失敗しました",
  });

export async function loadBrowserThreadQueries() {
  const value =
    await threadQueriesBrowserStore.get(
      QUERIES_KEY
    );

  if (value === undefined) {
    return [];
  }

  return decodeThreadQueriesStorageValue(
    value
  ).data;
}

export async function saveBrowserThreadQueries(
  queries
) {
  const value =
    encodeThreadQueriesStorageValue(queries);

  await threadQueriesBrowserStore.put(
    value,
    QUERIES_KEY
  );
}

export async function clearBrowserThreadQueries() {
  await threadQueriesBrowserStore.delete(
    QUERIES_KEY
  );
}
