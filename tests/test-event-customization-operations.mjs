import assert from "node:assert/strict";

import {
  addEventCustomization,
  customizationCounts,
  hideEventCustomization,
  removeAddedEventCustomization,
  restoreHiddenEventCustomization,
  updateEventOverride,
} from "../src/event-customization-operations.js";

const original = {
  overrides: {
    a: {
      title: "旧タイトル",
      summary: "旧概要",
      importance: 3,
      date: "1905",
    },
  },
  hidden: ["b"],
  additions: [
    {
      id: "custom-1",
      title: "追加",
    },
  ],
};

assert.deepEqual(
  customizationCounts(original),
  {
    overrideCount: 1,
    hiddenCount: 1,
    additionCount: 1,
    total: 3,
  }
);

const resetEditable = updateEventOverride(
  original,
  "a",
  {}
);

assert.deepEqual(
  resetEditable.merged,
  {
    date: "1905",
  }
);
assert.deepEqual(
  resetEditable.next.overrides.a,
  {
    date: "1905",
  }
);

const onlyEditable = updateEventOverride(
  {
    overrides: {
      a: {
        title: "旧タイトル",
        summary: "旧概要",
        importance: 3,
      },
    },
    hidden: [],
    additions: [],
  },
  "a",
  {}
);

assert.equal(
  Object.hasOwn(
    onlyEditable.next.overrides,
    "a"
  ),
  false
);

const changed = updateEventOverride(
  original,
  "a",
  {
    title: "新タイトル",
    summary: "新概要",
    importance: 2,
  }
);

assert.deepEqual(
  changed.next.overrides.a,
  {
    date: "1905",
    title: "新タイトル",
    summary: "新概要",
    importance: 2,
  }
);

const added = addEventCustomization(
  original,
  {
    id: "custom-2",
    title: "追加2",
  }
);
assert.deepEqual(
  added.additions.map((item) => item.id),
  ["custom-1", "custom-2"]
);

const removed =
  removeAddedEventCustomization(
    added,
    "custom-1"
  );
assert.deepEqual(
  removed.additions.map((item) => item.id),
  ["custom-2"]
);

const hiddenOnce =
  hideEventCustomization(
    original,
    "a"
  );
const hiddenTwice =
  hideEventCustomization(
    hiddenOnce,
    "a"
  );
assert.deepEqual(
  hiddenTwice.hidden,
  ["b", "a"]
);

const restored =
  restoreHiddenEventCustomization(
    hiddenTwice,
    "a"
  );
assert.deepEqual(
  restored.hidden,
  ["b"]
);

// Pure operations must not mutate the source object.
assert.equal(
  original.overrides.a.title,
  "旧タイトル"
);
assert.deepEqual(
  original.hidden,
  ["b"]
);
assert.deepEqual(
  original.additions.map((item) => item.id),
  ["custom-1"]
);

console.log(
  "OK: event customization operations"
);
