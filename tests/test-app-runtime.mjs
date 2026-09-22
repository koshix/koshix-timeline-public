import assert from "node:assert/strict";

import {
  createAppRuntimeState,
  resolveAppShareUrl,
} from "../src/app-runtime.js";

const events = [
  {
    id: "event-1",
  },
];

const defaults = {
  birthYear: 1965,
  birthMonth: 7,
  education: [
    {
      start: "1983",
      years: "4",
      type: "university",
    },
  ],
};

const fromDefaults =
  createAppRuntimeState({
    config: {
      title: "Test Timeline",
      hashtag: "#test",
      defaults,
    },
    events,
    saved: {},
    location: {
      origin: "https://example.com",
      pathname: "/timeline/",
      search: "?ignored=1",
      hash: "#ignored",
    },
  });

assert.equal(
  fromDefaults.appTitle,
  "Test Timeline"
);
assert.equal(
  fromDefaults.hashtag,
  "#test"
);
assert.equal(
  fromDefaults.events,
  events
);
assert.equal(
  fromDefaults.initialBirth,
  1965
);
assert.equal(
  fromDefaults.initialMonth,
  7
);
assert.deepEqual(
  fromDefaults.initialEducation,
  defaults.education
);
assert.deepEqual(
  fromDefaults.initialAdultPeriods,
  []
);
assert.equal(
  fromDefaults.shareUrl,
  "https://example.com/timeline/"
);
assert.equal(
  fromDefaults.showBeginnerGuide,
  true
);
assert.equal(
  fromDefaults.settingsStorageStatus,
  "ok"
);
assert.equal(
  fromDefaults.settingsAutoSaveEnabled,
  true
);

const futureSettings =
  createAppRuntimeState({
    saved: {},
    settingsStorageStatus: "future",
  });

assert.equal(
  futureSettings.settingsAutoSaveEnabled,
  false
);

const invalidSettings =
  createAppRuntimeState({
    saved: {},
    settingsStorageStatus: "invalid",
  });

assert.equal(
  invalidSettings.settingsAutoSaveEnabled,
  false
);

const obsoleteSettings =
  createAppRuntimeState({
    saved: {},
    settingsStorageStatus: "obsolete",
  });

assert.equal(
  obsoleteSettings.settingsAutoSaveEnabled,
  true
);

const savedEducation = [
  {
    start: "2000",
    years: "2",
    type: "masters",
  },
];

const savedAdultPeriods = [
  {
    start: "2002",
    end: "",
    label: "第1期",
  },
];

const fromSaved =
  createAppRuntimeState({
    config: {
      defaults,
      shareUrl:
        " https://share.example/app ",
    },
    saved: {
      birth: 1970,
      month: 3,
      education: savedEducation,
      adultPeriods: savedAdultPeriods,
      beginnerGuideSeen: true,
    },
    location: {
      origin: "https://ignored.example",
      pathname: "/ignored/",
    },
  });

assert.equal(
  fromSaved.initialBirth,
  1970
);
assert.equal(
  fromSaved.initialMonth,
  3
);
assert.deepEqual(
  fromSaved.initialEducation,
  savedEducation
);
assert.equal(
  fromSaved.initialAdultPeriods,
  savedAdultPeriods
);
assert.equal(
  fromSaved.shareUrl,
  "https://share.example/app"
);
assert.equal(
  fromSaved.showBeginnerGuide,
  false
);

assert.equal(
  resolveAppShareUrl(
    {},
    null
  ),
  ""
);

console.log(
  "OK: shared app runtime initialization"
);
