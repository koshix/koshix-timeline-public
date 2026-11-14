import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLIC_EVENT_SUB_TAG_KEYS,
  PUBLIC_EVENT_SUB_TAG_LABELS,
} from "../src/event-schema.js";

test("all 33 subs have unique two-kanji labels", () => {
  const labels = PUBLIC_EVENT_SUB_TAG_LABELS;
  assert.equal(PUBLIC_EVENT_SUB_TAG_KEYS.length, 33);
  assert.deepEqual(
    Object.keys(labels),
    PUBLIC_EVENT_SUB_TAG_KEYS
  );
  assert.equal(new Set(Object.values(labels)).size, 33);
  for (const label of Object.values(labels)) {
    assert.match(label, /^\p{Script=Han}{2}$/u);
  }
  assert.equal(labels.food, "食農");
  assert.equal(labels.game, "遊戯");
  assert.equal(labels.sport, "体育");
  assert.equal(labels.gender, "性差");
  assert.equal(labels.energy, "資源");
  assert.equal(labels.colonialism, "植民");
});
