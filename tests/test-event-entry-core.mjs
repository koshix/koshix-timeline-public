import assert from "node:assert/strict";
import test from "node:test";

import {
  readRows,
  serializeRows,
  sortRowsByDate,
} from "../scripts/event-entry-core.mjs";

const row = (id, date, title) => ({
  id,
  date,
  end_date: "",
  title,
  cats: "work",
  primary: "work",
  subs: "literature",
  region: "",
  importance: "1",
  summary: "test",
  sources: "",
  search: "",
  note: "",
});

test("sortRowsByDate inserts an older event into chronological order", () => {
  const rows = [
    row("a", "1950", "A"),
    row("c", "1970", "C"),
    row("b", "1960", "B"),
  ];

  const sorted = sortRowsByDate(rows);

  assert.deepEqual(
    sorted.map((r) => r.date),
    ["1950", "1960", "1970"]
  );
});

test("sortRowsByDate preserves order for equal dates", () => {
  const rows = [
    row("a", "1960", "A"),
    row("b", "1960", "B"),
    row("c", "1960", "C"),
  ];

  const sorted = sortRowsByDate(rows);

  assert.deepEqual(
    sorted.map((r) => r.id),
    ["a", "b", "c"]
  );
});

test("serializeRows and readRows round-trip", () => {
  const rows = [
    row("a", "1950", "A"),
    row("b", "1960", "B"),
  ];

  assert.deepEqual(
    readRows(serializeRows(rows)),
    rows
  );
});
