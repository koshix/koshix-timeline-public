import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLIC_EVENT_SUB_FILTER_ICONS,
  PUBLIC_EVENT_SUB_FILTER_ROWS,
} from "../src/event-schema.js";
import {
  PUBLIC_EVENT_ICON_NAMES,
} from "../src/event-icon.js";

const EXPECTED_ROWS = [
  [
    "thought",
    "rights",
    "law",
    "unrest",
    "politics",
    "economy",
  ],
  [
    "literature",
    "music",
    "art",
    "visual",
    "communication",
    "industry",
  ],
  [
    "technology",
    "math",
    "matter",
    "life",
    "environment",
    "space",
  ],
];

test("sub filters use fixed 6 x 3 layout", () => {
  assert.deepEqual(
    PUBLIC_EVENT_SUB_FILTER_ROWS.map((row) =>
      row.map(([key]) => key)
    ),
    EXPECTED_ROWS
  );
});

test("every sub filter has one or two valid icons", () => {
  const keys =
    PUBLIC_EVENT_SUB_FILTER_ROWS
      .flat()
      .map(([key]) => key);

  assert.deepEqual(
    [...Object.keys(PUBLIC_EVENT_SUB_FILTER_ICONS)].sort(),
    [...keys].sort()
  );

  for (const key of keys) {
    const icons =
      PUBLIC_EVENT_SUB_FILTER_ICONS[key];

    assert.ok(
      icons.length >= 1 && icons.length <= 2,
      `${key}: icon count must be 1 or 2`
    );

    for (const icon of icons) {
      assert.ok(
        PUBLIC_EVENT_ICON_NAMES.has(icon),
        `${key}: unknown icon ${icon}`
      );
    }
  }
});
