import {
  createVersionedRecord,
  decodeVersionedRecord,
} from "./versioned-storage.js";

import {
  createIndexedDbKeyValueStore,
} from "./indexeddb-key-value-store.js";

const DB_NAME = "koshix-timeline-customizations";
const DB_VERSION = 1;
const STORE_NAME = "customizations";
const CUSTOMIZATIONS_KEY = "event-customizations";

export const EVENT_CUSTOMIZATIONS_STORAGE_FORMAT =
  "koshix-timeline-event-customizations";
export const EVENT_CUSTOMIZATIONS_STORAGE_VERSION = 3;

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

const eventCustomizationsBrowserStore =
  createIndexedDbKeyValueStore({
    dbName: DB_NAME,
    dbVersion: DB_VERSION,
    storeName: STORE_NAME,
    unavailableMessage:
      "このブラウザでは年表カスタマイズのブラウザ保存を利用できません",
    openErrorMessage:
      "年表カスタマイズ保存用データベースを開けませんでした",
    operationErrorMessage:
      "年表カスタマイズデータの読み書きに失敗しました",
  });

export async function loadBrowserEventCustomizations() {
  const value = await eventCustomizationsBrowserStore.get(CUSTOMIZATIONS_KEY);

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

  await eventCustomizationsBrowserStore.put(value, CUSTOMIZATIONS_KEY);
}

export async function clearBrowserEventCustomizations() {
  await eventCustomizationsBrowserStore.delete(CUSTOMIZATIONS_KEY);
}
