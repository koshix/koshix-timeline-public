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

export function readSettingsStorage() {
  let raw;

  try {
    raw = window.localStorage.getItem(
      SETTINGS_STORAGE_KEY
    );
  } catch (error) {
    return {
      status: "unavailable",
      data: null,
      error,
    };
  }

  if (raw == null) {
    return {
      status: "missing",
      data: null,
      error: null,
    };
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      status: "invalid",
      data: null,
      error,
    };
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    parsed.format ===
      SETTINGS_STORAGE_FORMAT &&
    Number.isInteger(
      parsed.schemaVersion
    )
  ) {
    if (
      parsed.schemaVersion >
      SETTINGS_STORAGE_VERSION
    ) {
      return {
        status: "future",
        data: null,
        error: new Error(
          `設定保存データは新しい形式(version ${parsed.schemaVersion})です`
        ),
      };
    }

    if (
      parsed.schemaVersion <
      SETTINGS_STORAGE_VERSION
    ) {
      return {
        status: "obsolete",
        data: null,
        error: null,
      };
    }
  }

  try {
    return {
      status: "ok",
      data:
        decodeSettingsStorageValue(
          parsed
        ).data,
      error: null,
    };
  } catch (error) {
    return {
      status: "invalid",
      data: null,
      error,
    };
  }
}

export const settingsStore = {
  read: readSettingsStorage,

  load() {
    return readSettingsStorage().data;
  },

  save(data) {
    try {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(
          encodeSettingsStorageValue(data)
        )
      );

      return {
        ok: true,
        error: null,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
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
