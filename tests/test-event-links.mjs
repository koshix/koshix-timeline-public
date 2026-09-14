import assert from "node:assert/strict";
import {
  clipShareText,
  eventId,
  findEventByShareParam,
  legacyEventId,
  weighShareText,
} from "../src/event-links.js";

const legacyEvent = {
  date: "2000",
  title: "Test",
};

assert.equal(
  legacyEventId(legacyEvent),
  "2000-1g18kc"
);

assert.equal(
  eventId({
    id: "permanent-001",
    date: "2000",
    title: "Test",
  }),
  "permanent-001"
);

assert.equal(
  eventId(legacyEvent),
  "2000-1g18kc"
);

const events = [
  {
    id: "event-001",
    date: "1972",
    title: "大学入学",
  },
  {
    date: "2000",
    title: "Test",
  },
  {
    id: "event-003",
    date: "2020",
    title: "ＡＩ と 社会",
  },
];

assert.equal(
  findEventByShareParam(
    events,
    "event-001"
  ),
  events[0]
);

assert.equal(
  findEventByShareParam(
    events,
    "2000-1g18kc"
  ),
  events[1]
);

assert.equal(
  findEventByShareParam(
    events,
    encodeURIComponent("2020-AIと社会")
  ),
  events[2]
);

assert.equal(
  findEventByShareParam(
    events,
    encodeURIComponent("1972-大学")
  ),
  events[0]
);

assert.equal(
  findEventByShareParam(events, ""),
  null
);

assert.equal(
  findEventByShareParam(
    events,
    "not-found"
  ),
  null
);

assert.equal(
  weighShareText("ABC"),
  3
);

assert.equal(
  weighShareText("日本"),
  4
);

assert.equal(
  weighShareText("AI日本"),
  6
);

assert.equal(
  clipShareText(
    "abcdef",
    20
  ),
  "abcdef"
);

assert.equal(
  clipShareText(
    "abcdefghij",
    7
  ),
  "abcde…"
);

assert.equal(
  clipShareText(
    "日本語です。",
    8
  ),
  "日本語…"
);

console.log(
  "OK: イベントID・共有URL互換・共有文字数処理を検査しました"
);
