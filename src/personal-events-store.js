import {
  createVersionedRecord,
  decodeVersionedRecord,
} from "./versioned-storage.js";

import {
  createIndexedDbKeyValueStore,
} from "./indexeddb-key-value-store.js";

const DB_NAME = "koshix-timeline";
const DB_VERSION = 1;
const STORE_NAME = "personal-history";
const EVENTS_KEY = "personal-events";

export const PERSONAL_EVENTS_STORAGE_FORMAT =
  "koshix-timeline-personal-events";
export const PERSONAL_EVENTS_STORAGE_VERSION = 3;

function validatePersonalEvents(value) {
  if (!Array.isArray(value)) {
    throw new Error("ブラウザ内の個人史データ形式が不正です");
  }

  return value;
}

export function encodePersonalEventsStorageValue(events) {
  return createVersionedRecord(
    PERSONAL_EVENTS_STORAGE_FORMAT,
    PERSONAL_EVENTS_STORAGE_VERSION,
    validatePersonalEvents(events)
  );
}

export function decodePersonalEventsStorageValue(value) {
  return decodeVersionedRecord(value, {
    format: PERSONAL_EVENTS_STORAGE_FORMAT,
    currentVersion: PERSONAL_EVENTS_STORAGE_VERSION,
    validateData: validatePersonalEvents,
    context: "個人史保存データ",
  });
}

const personalEventsBrowserStore =
  createIndexedDbKeyValueStore({
    dbName: DB_NAME,
    dbVersion: DB_VERSION,
    storeName: STORE_NAME,
    unavailableMessage:
      "このブラウザでは個人史のブラウザ保存を利用できません",
    openErrorMessage:
      "個人史保存用データベースを開けませんでした",
    operationErrorMessage:
      "個人史データの読み書きに失敗しました",
  });

export async function loadBrowserPersonalEvents() {
  const value = await personalEventsBrowserStore.get(EVENTS_KEY);

  if (value === undefined) {
    return [];
  }

  return decodePersonalEventsStorageValue(value).data;
}

export async function saveBrowserPersonalEvents(events) {
  const value = encodePersonalEventsStorageValue(events);

  await personalEventsBrowserStore.put(value, EVENTS_KEY);
}

export async function clearBrowserPersonalEvents() {
  await personalEventsBrowserStore.delete(EVENTS_KEY);
}
