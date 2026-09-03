export const SETTINGS_STORAGE_KEY = "sf-lifeline";

export const settingsStore = {
  load() {
    try {
      return JSON.parse(
        window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "null"
      );
    } catch {
      return null;
    }
  },

  save(data) {
    try {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(data)
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
        JSON.stringify(data)
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
