import {
  createVersionedRecord,
  decodeVersionedRecord,
} from "./versioned-storage.js";

export const SETTINGS_STORAGE_KEY =
  "koshix-timeline:settings";
export const SETTINGS_STORAGE_FORMAT =
  "koshix-timeline-settings";
export const SETTINGS_STORAGE_VERSION = 3;

export function encodeSettingsStorageValue(data) {
  return createVersionedRecord(
    SETTINGS_STORAGE_FORMAT,
    SETTINGS_STORAGE_VERSION,
    data
  );
}

export function decodeSettingsStorageValue(value) {
  return decodeVersionedRecord(value, {
    format: SETTINGS_STORAGE_FORMAT,
    currentVersion: SETTINGS_STORAGE_VERSION,
    context: "設定保存データ",
  });
}

export const settingsStore = {
  load() {
    try {
      const raw = window.localStorage.getItem(
        SETTINGS_STORAGE_KEY
      );

      if (raw == null) {
        return null;
      }

      return decodeSettingsStorageValue(
        JSON.parse(raw)
      ).data;
    } catch {
      return null;
    }
  },

  save(data) {
    try {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(
          encodeSettingsStorageValue(data)
        )
      );
    } catch {}
  },

  replace(data) {
    const storage = window.localStorage;
    const backup = storage.getItem(
      SETTINGS_STORAGE_KEY
    );

    try {
      storage.removeItem(
        SETTINGS_STORAGE_KEY
      );
      storage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(
          encodeSettingsStorageValue(data)
        )
      );
    } catch (err) {
      try {
        storage.removeItem(
          SETTINGS_STORAGE_KEY
        );

        if (backup != null) {
          storage.setItem(
            SETTINGS_STORAGE_KEY,
            backup
          );
        }
      } catch {}

      throw err;
    }
  },
};
