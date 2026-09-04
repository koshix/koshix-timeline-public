import assert from "node:assert/strict";

import {
  SETTINGS_STORAGE_KEY,
  SETTINGS_STORAGE_FORMAT,
  SETTINGS_STORAGE_VERSION,
  decodeSettingsStorageValue,
  encodeSettingsStorageValue,
} from "../src/settings-store.js";
import {
  PERSONAL_EVENTS_STORAGE_FORMAT,
  PERSONAL_EVENTS_STORAGE_VERSION,
  decodePersonalEventsStorageValue,
  encodePersonalEventsStorageValue,
} from "../src/personal-events-store.js";
import {
  EVENT_CUSTOMIZATIONS_STORAGE_FORMAT,
  EVENT_CUSTOMIZATIONS_STORAGE_VERSION,
  decodeEventCustomizationsStorageValue,
  encodeEventCustomizationsStorageValue,
} from "../src/event-customizations-store.js";
import {
  createVersionedRecord,
  decodeVersionedRecord,
} from "../src/versioned-storage.js";

assert.equal(
  SETTINGS_STORAGE_KEY,
  "koshix-timeline:settings"
);

const settings = {
  birthYear: 1965,
  showMe: true,
};

const encodedSettings = encodeSettingsStorageValue(settings);
assert.deepEqual(encodedSettings, {
  format: SETTINGS_STORAGE_FORMAT,
  schemaVersion: SETTINGS_STORAGE_VERSION,
  data: settings,
});

const currentSettings = decodeSettingsStorageValue(encodedSettings);
assert.equal(currentSettings.migrated, false);
assert.deepEqual(currentSettings.data, settings);

assert.throws(
  () => decodeSettingsStorageValue(settings),
  /version付き形式が不正/
);

const personalEvents = [
  {
    id: "me-1",
    date: "2000-01-01",
    y: 2000,
    t: "個人史",
    cats: ["me"],
    primary: "me",
    importance: 2,
    ic: "flag",
    n: "個人史テスト",
  },
];

const encodedPersonal = encodePersonalEventsStorageValue(
  personalEvents
);
assert.equal(
  encodedPersonal.format,
  PERSONAL_EVENTS_STORAGE_FORMAT
);
assert.equal(
  encodedPersonal.schemaVersion,
  PERSONAL_EVENTS_STORAGE_VERSION
);
assert.deepEqual(encodedPersonal.data, personalEvents);

const currentPersonal = decodePersonalEventsStorageValue(
  encodedPersonal
);
assert.equal(currentPersonal.migrated, false);
assert.deepEqual(currentPersonal.data, personalEvents);

assert.throws(
  () => decodePersonalEventsStorageValue(personalEvents),
  /version付き形式が不正/
);

assert.throws(
  () =>
    decodePersonalEventsStorageValue(
      createVersionedRecord(
        PERSONAL_EVENTS_STORAGE_FORMAT,
        PERSONAL_EVENTS_STORAGE_VERSION,
        { bad: true }
      )
    ),
  /個人史データ形式が不正/
);

const customizations = {
  overrides: {
    "event-1": {
      t: "変更後",
    },
  },
  hidden: ["event-2"],
  additions: [],
};

const encodedCustomizations =
  encodeEventCustomizationsStorageValue(customizations);
assert.equal(
  encodedCustomizations.format,
  EVENT_CUSTOMIZATIONS_STORAGE_FORMAT
);
assert.equal(
  encodedCustomizations.schemaVersion,
  EVENT_CUSTOMIZATIONS_STORAGE_VERSION
);
assert.deepEqual(encodedCustomizations.data, customizations);

const currentCustomizations =
  decodeEventCustomizationsStorageValue(
    encodedCustomizations
  );
assert.equal(currentCustomizations.migrated, false);
assert.deepEqual(currentCustomizations.data, customizations);

assert.throws(
  () =>
    decodeEventCustomizationsStorageValue(customizations),
  /version付き形式が不正/
);

assert.throws(
  () =>
    decodeSettingsStorageValue({
      format: SETTINGS_STORAGE_FORMAT,
      schemaVersion: SETTINGS_STORAGE_VERSION + 1,
      data: settings,
    }),
  /新しい形式/
);

assert.throws(
  () =>
    decodeSettingsStorageValue({
      format: "other-format",
      schemaVersion: SETTINGS_STORAGE_VERSION,
      data: settings,
    }),
  /形式が不正/
);

const version1 = createVersionedRecord(
  "test-format",
  1,
  { count: 1 }
);

const migratedToVersion2 = decodeVersionedRecord(
  version1,
  {
    format: "test-format",
    currentVersion: 2,
    migrations: {
      1: (data) => ({ ...data, count: data.count + 1 }),
    },
  }
);

assert.equal(migratedToVersion2.migrated, true);
assert.deepEqual(migratedToVersion2.data, { count: 2 });
assert.deepEqual(
  migratedToVersion2.record,
  createVersionedRecord("test-format", 2, { count: 2 })
);

assert.throws(
  () =>
    decodeVersionedRecord(version1, {
      format: "test-format",
      currentVersion: 2,
    }),
  /移行処理がありません/
);

console.log(
  "OK: settings / personal events / event customizations のversion付き保存・厳密読込・将来version拒否を検査しました"
);
