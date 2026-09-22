import assert from "node:assert/strict";

import {
  applyPersonalEventDraft,
  createPersonalDraft,
  personalDraftFromEvent,
  removePersonalEventById,
} from "../src/personal-event-operations.js";

assert.deepEqual(
  createPersonalDraft(),
  {
    date: "",
    title: "",
    importance: 2,
    summary: "",
  }
);

const original = [
  {
    id: "me-1",
    date: "2000",
    title: "旧タイトル",
    cats: ["me"],
    primary: "me",
    importance: 2,
    summary: "旧概要",
    note: "保持する内部値",
  },
];

assert.deepEqual(
  personalDraftFromEvent(
    original[0]
  ),
  {
    date: "2000",
    title: "旧タイトル",
    importance: 2,
    summary: "旧概要",
  }
);

const updated =
  applyPersonalEventDraft(
    original,
    {
      existing: original[0],
      draft: {
        date: " 2001 ",
        title: " 新タイトル ",
        importance: "3",
        summary: " 新概要 ",
      },
    }
  );

assert.equal(
  updated.created,
  false
);
assert.deepEqual(
  updated.event,
  {
    id: "me-1",
    date: "2001",
    title: "新タイトル",
    cats: ["me"],
    primary: "me",
    importance: 3,
    summary: "新概要",
    note: "保持する内部値",
  }
);
assert.equal(
  original[0].title,
  "旧タイトル"
);

const added =
  applyPersonalEventDraft(
    original,
    {
      newId: "me-2",
      draft: {
        date: " 2002-03-04 ",
        title: " 追加項目 ",
        importance: "1",
        summary: " 追加概要 ",
      },
    }
  );

assert.equal(
  added.created,
  true
);
assert.deepEqual(
  added.event,
  {
    id: "me-2",
    date: "2002-03-04",
    title: "追加項目",
    importance: 1,
    summary: "追加概要",
    cats: ["me"],
    primary: "me",
  }
);
assert.deepEqual(
  added.events.map(
    (event) => event.id
  ),
  ["me-1", "me-2"]
);

assert.throws(
  () =>
    applyPersonalEventDraft(
      original,
      {
        newId: "me-1",
        draft: {},
      }
    ),
  /重複/
);

const removed =
  removePersonalEventById(
    added.events,
    "me-1"
  );

assert.deepEqual(
  removed.map(
    (event) => event.id
  ),
  ["me-2"]
);
assert.equal(
  added.events.length,
  2
);

console.log(
  "OK: personal event pure operations"
);
