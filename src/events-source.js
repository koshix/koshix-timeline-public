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

const MAIN_CATS = new Set([
  "sf",
  "work",
  "science",
  "education",
  "computer",
  "culture",
  "society",
]);

let currentEvents = null;

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

export function parseEventsTsv(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("events.tsv にデータ行がありません");
  }

  const header = lines[0].split("\t");

  if (JSON.stringify(header) !== JSON.stringify(EXPECTED_HEADER)) {
    throw new Error("events.tsv のヘッダーが一致しません");
  }

  const ids = new Set();
  const events = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cols = lines[i].split("\t");

    if (cols.length !== EXPECTED_HEADER.length) {
      throw new Error(
        `${lineNo}行目: 列数が ${cols.length}。` +
        `${EXPECTED_HEADER.length}列必要です`
      );
    }

    const row = Object.fromEntries(
      EXPECTED_HEADER.map((key, j) => [key, cols[j].trim()])
    );

    if (!row.id) {
      throw new Error(`${lineNo}行目: id がありません`);
    }

    if (ids.has(row.id)) {
      throw new Error(`${lineNo}行目: id "${row.id}" が重複しています`);
    }
    ids.add(row.id);

    if (!validDate(row.date)) {
      throw new Error(`${lineNo}行目: date "${row.date}" の形式が不正です`);
    }

    if (row.end_date && !validDate(row.end_date)) {
      throw new Error(
        `${lineNo}行目: end_date "${row.end_date}" の形式が不正です`
      );
    }

    const cats = splitList(row.cats);

    if (cats.length === 0) {
      throw new Error(`${lineNo}行目: cats が空です`);
    }

    for (const cat of cats) {
      if (!MAIN_CATS.has(cat)) {
        throw new Error(`${lineNo}行目: 未知のカテゴリー "${cat}"`);
      }
    }

    if (!MAIN_CATS.has(row.primary)) {
      throw new Error(
        `${lineNo}行目: primary "${row.primary}" が不正です`
      );
    }

    if (!cats.includes(row.primary)) {
      throw new Error(
        `${lineNo}行目: primary "${row.primary}" が cats に含まれていません`
      );
    }

    const importance = Number(row.importance);

    if (![1, 2, 3].includes(importance)) {
      throw new Error(
        `${lineNo}行目: importance は 1, 2, 3 のいずれかです`
      );
    }

    if (!["0", "1"].includes(row.core)) {
      throw new Error(
        `${lineNo}行目: core は 0 または 1 にしてください`
      );
    }

    const core = row.core === "1";

    if (!row.title) {
      throw new Error(`${lineNo}行目: title がありません`);
    }

    if (!row.summary) {
      throw new Error(`${lineNo}行目: summary がありません`);
    }

    if (!row.icon) {
      throw new Error(`${lineNo}行目: icon がありません`);
    }

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


  return events;
}

/*
 * 公開イベントをランタイムで準備する。
 *
 * public/events.tsv を唯一の公開イベント源として読み込み、検査する。
 * 読み込みや検査に失敗した場合は例外を上位へ渡す。
 */
export async function prepareEvents() {
  const res = await fetch(
    `${import.meta.env.BASE_URL}events.tsv`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`events.tsv の読み込みに失敗しました: HTTP ${res.status}`);
  }

  const text = await res.text();
  const events = parseEventsTsv(text);

  currentEvents = events;
  console.info(`Runtime events TSV loaded: ${events.length} events`);
}

/*
 * App.jsx から見た公開イベントの取得窓口。
 * prepareEvents() 完了後に呼ばれるため、通常はTSV版を返す。
 */
export function loadEvents() {
  if (currentEvents === null) {
    throw new Error("公開イベントがまだ準備されていません");
  }
  return currentEvents;
}
