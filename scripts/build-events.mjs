import fs from "node:fs";

const INPUT = "public/events.tsv";

const MAIN_CATS = new Set([
  "sf",
  "work",
  "science",
  "education",
  "computer",
  "culture",
  "society",
]);

const EXPECTED_HEADER = [
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
  "core",
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function splitList(value) {
  if (!value) return [];
  return value
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
  fail(`${INPUT} がありません`);
}

const text = fs.readFileSync(INPUT, "utf8").replace(/\r\n/g, "\n");
const lines = text.split("\n").filter((line) => line.trim() !== "");

if (lines.length < 2) {
  fail("データ行がありません");
}

const header = lines[0].split("\t");

if (JSON.stringify(header) !== JSON.stringify(EXPECTED_HEADER)) {
  console.error("期待するヘッダー:");
  console.error(EXPECTED_HEADER.join("\t"));
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

  if (cols.length !== EXPECTED_HEADER.length) {
    fail(
      `${lineNo}行目: 列数が ${cols.length}。` +
      `${EXPECTED_HEADER.length}列必要です`
    );
  }

  const row = Object.fromEntries(
    EXPECTED_HEADER.map((key, j) => [key, cols[j].trim()])
  );

  if (!row.id) {
    fail(`${lineNo}行目: id がありません`);
  }

  if (ids.has(row.id)) {
    fail(`${lineNo}行目: id "${row.id}" が重複しています`);
  }
  ids.add(row.id);

  if (!validDate(row.date)) {
    fail(`${lineNo}行目: date "${row.date}" の形式が不正です`);
  }

  if (row.end_date && !validDate(row.end_date)) {
    fail(`${lineNo}行目: end_date "${row.end_date}" の形式が不正です`);
  }

  const cats = splitList(row.cats);

  if (cats.length === 0) {
    fail(`${lineNo}行目: cats が空です`);
  }

  for (const cat of cats) {
    if (!MAIN_CATS.has(cat)) {
      fail(`${lineNo}行目: 未知のカテゴリー "${cat}"`);
    }
  }

  if (!MAIN_CATS.has(row.primary)) {
    fail(`${lineNo}行目: primary "${row.primary}" が不正です`);
  }

  if (!cats.includes(row.primary)) {
    fail(
      `${lineNo}行目: primary "${row.primary}" が cats に含まれていません`
    );
  }

  const importance = Number(row.importance);

  if (![1, 2, 3].includes(importance)) {
    fail(`${lineNo}行目: importance は 1, 2, 3 のいずれかです`);
  }

  if (!["0", "1"].includes(row.core)) {
    fail(`${lineNo}行目: core は 0 または 1 にしてください`);
  }

  const core = row.core === "1";

  if (!row.title) {
    fail(`${lineNo}行目: title がありません`);
  }

  if (!row.summary) {
    fail(`${lineNo}行目: summary がありません`);
  }

  if (!row.icon) {
    fail(`${lineNo}行目: icon がありません`);
  }

  if (previousSourceEvent && row.date < previousSourceEvent.date) {
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

  const year = Number(row.date.slice(0, 4));

  events.push({
    id: row.id,
    date: row.date,
    ...(row.end_date ? { end_date: row.end_date } : {}),
    y: year,
    t: row.title,
    cats,
    primary: row.primary,
    ...(row.subs ? { subs: splitList(row.subs) } : {}),
    ...(row.region ? { region: row.region } : {}),
    importance,
    core,
    ic: row.icon,
    n: row.summary,
    ...(row.sources ? { l: splitList(row.sources) } : {}),
    ...(row.search ? { q: row.search } : {}),
    ...(row.note ? { note: row.note } : {}),
  });
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
