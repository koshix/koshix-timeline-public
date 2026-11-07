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
    "stage",
    "art",
    "design",
  ],
  [
    "visual",
    "communication",
    "technology",
    "industry",
    "lifestyle",
  ],
  [
    "math",
    "matter",
    "biomed",
    "environment",
    "space",
  ],
];

test("sub filters use 21 options in 6 columns", () => {
  assert.deepEqual(
    PUBLIC_EVENT_SUB_FILTER_ROWS.map((row) =>
      row.map(([key]) => key)
    ),
    EXPECTED_ROWS
  );
});

test("biomed has the science/health icons and life is not an independent filter", () => {
  assert.deepEqual(
    PUBLIC_EVENT_SUB_FILTER_ICONS.biomed,
    ["life-science", "life-health"]
  );
  assert.equal(
    Object.hasOwn(PUBLIC_EVENT_SUB_FILTER_ICONS, "life"),
    false
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
