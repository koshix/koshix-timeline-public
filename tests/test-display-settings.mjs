import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeSavedSubFilters,
} from "../src/useDisplaySettings.js";

test("legacy war filter migrates to unrest", () => {
  assert.deepEqual(
    normalizeSavedSubFilters(["war"]),
    ["unrest"]
  );
});

test("legacy revolution filter migrates to unrest", () => {
  assert.deepEqual(
    normalizeSavedSubFilters(["revolution"]),
    ["unrest"]
  );
});

test("war and revolution collapse to one unrest filter", () => {
  assert.deepEqual(
    normalizeSavedSubFilters([
      "war",
      "revolution",
      "unrest",
    ]),
    ["unrest"]
  );
});

test("other saved sub filters are preserved", () => {
  assert.deepEqual(
    normalizeSavedSubFilters([
      "thought",
      "war",
      "communication",
    ]),
    [
      "thought",
      "unrest",
      "communication",
    ]
  );
});

test("invalid saved sub filters fall back to empty", () => {
  assert.deepEqual(
    normalizeSavedSubFilters(null),
    []
  );
});
