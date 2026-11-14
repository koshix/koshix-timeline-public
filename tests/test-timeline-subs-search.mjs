import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLIC_EVENT_SUB_TAG_KEYS,
} from "../src/event-schema.js";

import {
  createTimelineSearch,
} from "../src/timeline-model.js";

test("all 33 official subs are searchable", () => {
  assert.equal(PUBLIC_EVENT_SUB_TAG_KEYS.length, 33);

  for (const tag of PUBLIC_EVENT_SUB_TAG_KEYS) {
    const search = createTimelineSearch(`subs:${tag}`);

    assert.equal(search.error, null);
    assert.equal(
      search.matches({
        title: "分類試験",
        subs: [tag],
      }),
      true,
      tag
    );
  }
});

test("subs search uses exact tag matching", () => {
  const event = {
    title: "religion game という文字を含む",
    subs: ["religion", "politics"],
  };

  assert.equal(
    createTimelineSearch("subs:religion").matches(event),
    true
  );

  assert.equal(
    createTimelineSearch("subs:game").matches(event),
    false
  );

  assert.equal(
    createTimelineSearch("subs:relig").matches(event),
    false
  );

  assert.equal(
    createTimelineSearch("subs:").matches(event),
    false
  );

  assert.equal(
    createTimelineSearch("subs:unrest").matches(event),
    false
  );

  assert.equal(
    createTimelineSearch("SUBS:RELIGION").matches(event),
    true
  );
});

test("subs search supports AND OR and parentheses", () => {
  const event = {
    title: "宗教改革",
    summary: "宗教制度の転換",
    subs: ["religion", "politics"],
  };

  const matches = (query) =>
    createTimelineSearch(query).matches(event);

  assert.equal(matches("宗教改革"), true);
  assert.equal(matches("subs:religion 宗教改革"), true);
  assert.equal(matches("subs:religion && 宗教改革"), true);
  assert.equal(matches("subs:game && 宗教改革"), false);
  assert.equal(matches("subs:game || 宗教改革"), true);
  assert.equal(
    matches("(subs:religion || subs:game) 宗教改革"),
    true
  );
});

test("visual and game stay distinct in subs search", () => {
  const event = {
    title: "ゲーム作品",
    primary: "computer",
    subs: ["game"],
  };

  assert.equal(
    createTimelineSearch("subs:game").matches(event),
    true
  );

  assert.equal(
    createTimelineSearch("subs:visual").matches(event),
    false
  );
});
