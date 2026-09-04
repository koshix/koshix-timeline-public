import fs from "node:fs";

import {
  decodeEventRow,
} from "../src/event-codec.js";
import {
  PUBLIC_EVENT_TSV_HEADER,
  validatePublicEventRow,
} from "../src/event-schema.js";

const INPUT = "public/events.tsv";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(INPUT)) {
  fail(`${INPUT} がありません`);
}

const text = fs
  .readFileSync(INPUT, "utf8")
  .replace(/\r\n/g, "\n");
const lines = text
  .split("\n")
  .filter((line) => line.trim() !== "");

if (lines.length < 2) {
  fail("データ行がありません");
}

const header = lines[0].split("\t");

if (
  JSON.stringify(header) !==
  JSON.stringify(PUBLIC_EVENT_TSV_HEADER)
) {
  console.error("期待するヘッダー:");
  console.error(PUBLIC_EVENT_TSV_HEADER.join("\t"));
  console.error("実際のヘッダー:");
  console.error(header.join("\t"));
  fail("TSVヘッダーが一致しません");
}

const ids = new Set();
const events = [];
let previousSourceEvent = null;

for (let i = 1; i < lines.length; i++) {
  const lineNo = i + 1;
  const cols = lines[i].split("\t");

  if (cols.length !== PUBLIC_EVENT_TSV_HEADER.length) {
    fail(
      `${lineNo}行目: 列数が ${cols.length}。` +
      `${PUBLIC_EVENT_TSV_HEADER.length}列必要です`
    );
  }

  const row = Object.fromEntries(
    PUBLIC_EVENT_TSV_HEADER.map(
      (key, j) => [key, cols[j].trim()]
    )
  );

  try {
    validatePublicEventRow(row);
  } catch (error) {
    fail(`${lineNo}行目: ${error.message}`);
  }

  if (ids.has(row.id)) {
    fail(
      `${lineNo}行目: id "${row.id}" が重複しています`
    );
  }
  ids.add(row.id);

  if (
    previousSourceEvent &&
    row.date < previousSourceEvent.date
  ) {
    fail(
      `${lineNo}行目: date "${row.date}" (${row.title}) が ` +
      `${previousSourceEvent.lineNo}行目の date ` +
      `"${previousSourceEvent.date}" (${previousSourceEvent.title}) より前です`
    );
  }

  previousSourceEvent = {
    lineNo,
    date: row.date,
    title: row.title,
  };

  events.push(
    decodeEventRow(row, {
      includeCore: true,
    })
  );
}

events.sort(
  (a, b) =>
    a.y - b.y ||
    a.date.localeCompare(b.date) ||
    a.t.localeCompare(b.t, "ja")
);

console.log(
  `OK: ${events.length}件を検査しました`
);
