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
  THREAD_QUERIES_STORAGE_FORMAT,
  THREAD_QUERIES_STORAGE_VERSION,
  decodeThreadQueriesStorageValue,
  encodeThreadQueriesStorageValue,
} from "../src/thread-queries-store.js";
import {
  createVersionedRecord,
  decodeVersionedRecord,
} from "../src/versioned-storage.js";

import {
  workspaceStore,
} from "../src/workspace-store.js";

assert.equal(
  SETTINGS_STORAGE_KEY,
  "koshix-timeline:settings"
);

assert.equal(
  typeof workspaceStore.settings.load,
  "function"
);

assert.equal(
  typeof workspaceStore.settings.save,
  "function"
);

assert.equal(
  typeof workspaceStore.settings.replace,
  "function"
);

assert.equal(
  typeof workspaceStore.personalEvents.load,
  "function"
);

assert.equal(
  typeof workspaceStore.personalEvents.save,
  "function"
);

assert.equal(
  typeof workspaceStore.personalEvents.clear,
  "function"
);

assert.equal(
  typeof workspaceStore.eventCustomizations.load,
  "function"
);

assert.equal(
  typeof workspaceStore.eventCustomizations.save,
  "function"
);

assert.equal(
  typeof workspaceStore.eventCustomizations.clear,
  "function"
);

assert.equal(
  typeof workspaceStore.threadQueries.load,
  "function"
);

assert.equal(
  typeof workspaceStore.threadQueries.save,
  "function"
);

assert.equal(
  typeof workspaceStore.threadQueries.clear,
  "function"
);

assert.equal(
  SETTINGS_STORAGE_VERSION,
  3
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

// 開発中の旧ブラウザ設定version 1 / 2は移行せず、明示的に破棄する。
assert.throws(
  () =>
    decodeSettingsStorageValue({
      format: SETTINGS_STORAGE_FORMAT,
      schemaVersion: 1,
      data: settings,
    }),
  /version 1 からの移行処理がありません/
);

assert.throws(
  () =>
    decodeSettingsStorageValue({
      format: SETTINGS_STORAGE_FORMAT,
      schemaVersion: 2,
      data: settings,
    }),
  /version 2 からの移行処理がありません/
);

assert.throws(
  () => decodeSettingsStorageValue(settings),
  /version付き形式が不正/
);

const personalEvents = [
  {
    id: "me-1",
    date: "2000-01-01",
    title: "個人史",
    cats: ["me"],
    primary: "me",
    importance: 2,
    icon: "flag",
    summary: "個人史テスト",
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
  () =>
    decodePersonalEventsStorageValue({
      format: PERSONAL_EVENTS_STORAGE_FORMAT,
      schemaVersion: 1,
      data: personalEvents,
    }),
  /version 1 からの移行処理がありません/
);

assert.throws(
  () =>
    decodePersonalEventsStorageValue({
      format: PERSONAL_EVENTS_STORAGE_FORMAT,
      schemaVersion: 2,
      data: personalEvents,
    }),
  /version 2 からの移行処理がありません/
);

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
      title: "変更後",
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

// 一般公開前の旧カスタマイズversion 1 / 2 / 3は移行せず、明示的に破棄する。
for (const schemaVersion of [1, 2, 3]) {
  assert.throws(
    () =>
      decodeEventCustomizationsStorageValue({
        format: EVENT_CUSTOMIZATIONS_STORAGE_FORMAT,
        schemaVersion,
        data: customizations,
      }),
    new RegExp(
      `version ${schemaVersion} からの移行処理がありません`
    )
  );
}

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

const threadQueries = [
  "半導体",
  "量子 || quantum",
];

const encodedThreadQueries =
  encodeThreadQueriesStorageValue(
    threadQueries
  );

assert.equal(
  encodedThreadQueries.format,
  THREAD_QUERIES_STORAGE_FORMAT
);

assert.equal(
  encodedThreadQueries.schemaVersion,
  THREAD_QUERIES_STORAGE_VERSION
);

assert.deepEqual(
  encodedThreadQueries.data,
  threadQueries
);

const currentThreadQueries =
  decodeThreadQueriesStorageValue(
    encodedThreadQueries
  );

assert.equal(
  currentThreadQueries.migrated,
  false
);

assert.deepEqual(
  currentThreadQueries.data,
  threadQueries
);

assert.deepEqual(
  encodeThreadQueriesStorageValue([
    " 半導体 ",
    "",
    "半導体",
    "量子",
  ]).data,
  ["半導体", "量子"]
);

assert.throws(
  () =>
    decodeThreadQueriesStorageValue(
      createVersionedRecord(
        THREAD_QUERIES_STORAGE_FORMAT,
        THREAD_QUERIES_STORAGE_VERSION,
        { bad: true }
      )
    ),
  /たどるキーワードデータ形式が不正/
);

assert.throws(
  () =>
    decodeThreadQueriesStorageValue({
      format:
        THREAD_QUERIES_STORAGE_FORMAT,
      schemaVersion:
        THREAD_QUERIES_STORAGE_VERSION + 1,
      data: threadQueries,
    }),
  /新しい形式/
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
  "OK: settings / personal events / event customizations / thread queries のversion付き保存・厳密読込・将来version拒否を検査しました"
);
