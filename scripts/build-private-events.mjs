import fs from "node:fs";

const INPUT = "public/private/events.tsv";

const HEADER = [
  "id",
  "date",
  "end_date",
  "title",
  "cats",
  "primary",
  "subs",
  "region",
  "importance",
  "icon",
  "summary",
  "sources",
  "search",
  "note",
];

function splitList(value) {
  return String(value ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function validDate(value) {
  if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) {
    return false;
  }

  const parts = value.split("-").map(Number);

  if (parts.length >= 2 && (parts[1] < 1 || parts[1] > 12)) {
    return false;
  }

  if (parts.length === 3 && (parts[2] < 1 || parts[2] > 31)) {
    return false;
  }

  return true;
}

if (!fs.existsSync(INPUT)) {
  console.log(`WARN: ${INPUT} がありません`);
  console.log("個人史TSVの検査をスキップします");
  process.exit(0);
}

const lines = fs
  .readFileSync(INPUT, "utf8")
  .replace(/\r\n/g, "\n")
  .split("\n")
  .filter(Boolean);

const header = lines.shift()?.split("\t") ?? [];

if (header.join("\t") !== HEADER.join("\t")) {
  throw new Error("private-events.tsv のヘッダーが想定と違います");
}

const ids = new Set();
const events = [];
let previousSourceEvent = null;

for (let i = 0; i < lines.length; i++) {
  const cells = lines[i].split("\t");
  const lineNo = i + 2;

  if (cells.length !== HEADER.length) {
    throw new Error(
      `${lineNo}行目: 列数が ${cells.length}。${HEADER.length}列必要です`
    );
  }

  const row = Object.fromEntries(
    HEADER.map((h, n) => [h, cells[n]])
  );

  if (!row.id) {
    throw new Error(`${lineNo}行目: id がありません`);
  }

  if (ids.has(row.id)) {
    throw new Error(`${lineNo}行目: id "${row.id}" が重複しています`);
  }

  ids.add(row.id);

  if (!validDate(row.date)) {
    throw new Error(`${lineNo}行目: date "${row.date}" が不正です`);
  }

  if (row.end_date && !validDate(row.end_date)) {
    throw new Error(`${lineNo}行目: end_date "${row.end_date}" が不正です`);
  }

  if (!row.title) {
    throw new Error(`${lineNo}行目: title がありません`);
  }

  if (!row.summary) {
    throw new Error(`${lineNo}行目: summary がありません`);
  }

  const cats = splitList(row.cats);

  if (!cats.includes("me")) {
    throw new Error(`${lineNo}行目: cats に me が必要です`);
  }

  if (row.primary !== "me") {
    throw new Error(`${lineNo}行目: primary は me にしてください`);
  }

  const importance = Number(row.importance);

  if (![1, 2, 3].includes(importance)) {
    throw new Error(`${lineNo}行目: importance は 1, 2, 3 のいずれかです`);
  }

  if (previousSourceEvent && row.date < previousSourceEvent.date) {
    throw new Error(
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

  events.push({
    id: row.id,
    date: row.date,
    ...(row.end_date ? { end_date: row.end_date } : {}),
    y: Number(row.date.slice(0, 4)),
    t: row.title,
    cats,
    primary: "me",
    ...(row.subs ? { subs: splitList(row.subs) } : {}),
    ...(row.region ? { region: row.region } : {}),
    importance,
    ic: row.icon || "flag",
    n: row.summary,
    ...(row.sources ? { l: splitList(row.sources) } : {}),
    ...(row.search ? { q: row.search } : {}),
    ...(row.note ? { note: row.note } : {}),
  });
}

events.sort(
  (a, b) =>
    a.date.localeCompare(b.date) ||
    a.title.localeCompare(b.title, "ja")
);

console.log(`OK: 個人史 ${events.length}件を検査しました`);
