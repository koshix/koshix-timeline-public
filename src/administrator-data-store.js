import {
  createVersionedRecord,
  decodeVersionedRecord,
} from "./versioned-storage.js";

import {
  createIndexedDbKeyValueStore,
} from "./indexeddb-key-value-store.js";

import {
  createLifeSettingsSnapshot,
} from "./life-settings.js";

import {
  parsePersonalEventsTsv,
  serializePersonalEventsTsv,
} from "./personal-events-tsv.js";

const DB_NAME =
  "koshix-timeline-administrator";
const DB_VERSION = 1;
const STORE_NAME = "administrator-data";
const DATA_KEY = "current";

export const ADMINISTRATOR_DATA_STORAGE_FORMAT =
  "koshix-timeline-administrator-data";
export const ADMINISTRATOR_DATA_STORAGE_VERSION = 1;

function validateAdministratorData(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "ブラウザ内の管理者データ形式が不正です"
    );
  }

  if (!Array.isArray(value.personalEvents)) {
    throw new Error(
      "ブラウザ内の管理者自分史データ形式が不正です"
    );
  }

  const personalEvents =
    value.personalEvents.length === 0
      ? []
      : parsePersonalEventsTsv(
          serializePersonalEventsTsv(
            value.personalEvents
          )
        );

  const lifeSettings =
    createLifeSettingsSnapshot(
      value.lifeSettings
    );

  return {
    personalEvents,
    lifeSettings,
  };
}

export function encodeAdministratorDataStorageValue(
  data
) {
  return createVersionedRecord(
    ADMINISTRATOR_DATA_STORAGE_FORMAT,
    ADMINISTRATOR_DATA_STORAGE_VERSION,
    validateAdministratorData(data)
  );
}

export function decodeAdministratorDataStorageValue(
  value
) {
  return decodeVersionedRecord(value, {
    format:
      ADMINISTRATOR_DATA_STORAGE_FORMAT,
    currentVersion:
      ADMINISTRATOR_DATA_STORAGE_VERSION,
    validateData:
      validateAdministratorData,
    context: "管理者保存データ",
  });
}

const administratorDataBrowserStore =
  createIndexedDbKeyValueStore({
    dbName: DB_NAME,
    dbVersion: DB_VERSION,
    storeName: STORE_NAME,
    unavailableMessage:
      "このブラウザでは管理者データのブラウザ保存を利用できません",
    openErrorMessage:
      "管理者データ保存用データベースを開けませんでした",
    operationErrorMessage:
      "管理者データの読み書きに失敗しました",
  });

export async function loadBrowserAdministratorData() {
  const value =
    await administratorDataBrowserStore.get(
      DATA_KEY
    );

  if (value === undefined) {
    return null;
  }

  return decodeAdministratorDataStorageValue(
    value
  ).data;
}

export async function saveBrowserAdministratorData(
  data
) {
  const value =
    encodeAdministratorDataStorageValue(
      data
    );

  await administratorDataBrowserStore.put(
    value,
    DATA_KEY
  );
}

export async function clearBrowserAdministratorData() {
  await administratorDataBrowserStore.delete(
    DATA_KEY
  );
}
