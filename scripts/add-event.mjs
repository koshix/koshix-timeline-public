import fs from "node:fs";
import {
  PUBLIC_EVENT_CATEGORIES,
  PUBLIC_EVENT_TSV_HEADER,
  isValidEventDate,
} from "../src/event-schema.js";

import {
  clean,
  eventId,
  EVENT_BUILDER,
  readRows,
  runBuilder,
} from "./event-entry-core.mjs";

const TSV = "public/events.tsv";
function list(v) {
  if (Array.isArray(v)) {
    return v.map(clean).filter(Boolean);
  }

  return clean(v)
    .split(/[|,、\s]+/)
    .map(clean)
    .filter(Boolean);
}

function sourceList(v) {
  if (Array.isArray(v)) {
    return v.map(sourceText).filter(Boolean);
  }

  const s = clean(v);
  if (!s) return [];

  // sourcesだけは空白では分割しない。
  // 複数ソースは | 区切り。
  return s.split("|").map(clean).filter(Boolean);
}

function sourceText(s) {
  if (typeof s === "string") {
    return clean(s);
  }

  if (!s || typeof s !== "object") {
    return "";
  }

  const target = clean(
    s.target ?? s.url ?? s.article
  );

  const label = clean(s.label);

  if (!target) return "";

  return label
    ? `${target}::${label}`
    : target;
}

function checkDate(value, name, optional = false) {
  const s = clean(value);

  if (!s && optional) return "";

  if (!isValidEventDate(s)) {
    throw new Error(
      `${name} は YYYY / YYYY-MM / YYYY-MM-DD で指定してください`
    );
  }

  return s;
}

function yearOf(date) {
  return Number(date.slice(0, 4));
}

async function readJson() {
  let text = "";

  for await (const chunk of process.stdin) {
    text += chunk;
  }

  if (!text.trim()) {
    throw new Error(
      "クリップボード／標準入力にJSONがありません"
    );
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(
      `JSONを読めません: ${e.message}`
    );
  }
}

function normalize(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(
      "各イベントはJSONオブジェクトで指定してください"
    );
  }

  const date = checkDate(data.date, "date");
  const year = yearOf(date);

  const endDate = checkDate(
    data.end_date,
    "end_date",
    true
  );

  const title = clean(data.title);

  if (!title) {
    throw new Error("title は必須です");
  }

  const cats = [...new Set(list(data.cats))];

  if (!cats.length) {
    throw new Error("cats は1つ以上必要です");
  }

  for (const cat of cats) {
    if (!PUBLIC_EVENT_CATEGORIES.has(cat)) {
      throw new Error(
        `未知の大分類です: ${cat}`
      );
    }
  }

  const primary =
    clean(data.primary) || cats[0];

  if (!PUBLIC_EVENT_CATEGORIES.has(primary)) {
    throw new Error(
      `未知の primary です: ${primary}`
    );
  }

  if (!cats.includes(primary)) {
    throw new Error(
      "primary は cats に含めてください"
    );
  }

  const importance =
    clean(data.importance || "2");

  if (!["1", "2", "3"].includes(importance)) {
    throw new Error(
      "importance は 1, 2, 3 のいずれかです"
    );
  }

  const summary = clean(data.summary);

  if (!summary) {
    throw new Error("summary は必須です");
  }

  const row = {
    id: eventId(year, title),
    date,
    end_date: endDate,
    title,
    cats: cats.join("|"),
    primary,
    subs: [...new Set(list(data.subs))].join("|"),
    region: clean(data.region),
    importance,
    summary,
    sources: sourceList(data.sources).join("|"),
    search: clean(data.search),
    note: clean(data.note),
  };

  for (const [key, value] of Object.entries(row)) {
    if (/[\t\r\n]/.test(value)) {
      throw new Error(
        `${key} にタブまたは改行は使えません`
      );
    }
  }

  return row;
}

function restoreFile(path, existed, original) {
  if (existed) {
    fs.writeFileSync(path, original);
  } else if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
}

async function addFromStdin() {
  if (!fs.existsSync(TSV)) {
    throw new Error(`${TSV} が見つかりません`);
  }

  if (!fs.existsSync(EVENT_BUILDER)) {
    throw new Error(`${EVENT_BUILDER} が見つかりません`);
  }

  const originalTsv =
    fs.readFileSync(TSV, "utf8");

  const existing = readRows(originalTsv);
  const input = await readJson();

  // 単一オブジェクトなら1件配列へ。
  const items = Array.isArray(input)
    ? input
    : [input];

  if (!items.length) {
    throw new Error(
      "イベント配列が空です"
    );
  }

  // まず全件をメモリ上で検査。
  // ここではまだTSVを書き換えない。
  const rows = items.map((item, i) => {
    try {
      return normalize(item);
    } catch (e) {
      throw new Error(
        `${i + 1}件目: ${e.message}`
      );
    }
  });

  const existingIds =
    new Set(existing.map((r) => r.id));

  const existingKeys =
    new Set(
      existing.map(
        (r) => `${r.date}\t${r.title}`
      )
    );

  const batchIds = new Set();
  const batchKeys = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (existingIds.has(row.id)) {
      throw new Error(
        `${i + 1}件目は既登録です: ${row.date} ${row.title}`
      );
    }

    const key = `${row.date}\t${row.title}`;

    if (existingKeys.has(key)) {
      throw new Error(
        `${i + 1}件目は既登録です: ${row.date} ${row.title}`
      );
    }

    if (batchIds.has(row.id)) {
      throw new Error(
        `${i + 1}件目は今回の一括データ内で重複しています: ${row.title}`
      );
    }

    if (batchKeys.has(key)) {
      throw new Error(
        `${i + 1}件目は今回の一括データ内で重複しています: ${row.date} ${row.title}`
      );
    }

    batchIds.add(row.id);
    batchKeys.add(key);
  }

  console.log(
    `一括追加候補: ${rows.length}件`
  );

  for (const row of rows) {
    console.log(
      `  ${row.date}  ${row.title}`
    );
  }

  // 全件検査を通過してから、一度に追記。
  const lines = rows.map(
    (row) =>
      PUBLIC_EVENT_TSV_HEADER
        .map((key) => row[key])
        .join("\t")
  );

  const base = originalTsv.endsWith("\n")
    ? originalTsv
    : originalTsv + "\n";

  fs.writeFileSync(
    TSV,
    base + lines.join("\n") + "\n",
    "utf8"
  );

  console.log(
    `\nevents.tsv に ${rows.length}件を追加しました`
  );

  console.log(
    "build-events.mjs で全体を検査します…"
  );

  if (!runBuilder()) {
    restoreFile(
      TSV,
      true,
      originalTsv
    );

    console.error(
      "\n検査に失敗したため、一括追加をすべて取り消しました。"
    );

    process.exitCode = 1;
    return;
  }

  console.log(
    `\nOK: ${rows.length}件の一括追加・検査・生成が完了しました。`
  );
}

async function main() {
  if (process.argv.includes("--stdin")) {
    await addFromStdin();
    return;
  }

  // 従来の手入力モードも予備として残す。
  await import(
    "./add-event-interactive.mjs"
  );
}

main().catch((err) => {
  console.error(
    `ERROR: ${err.message}`
  );

  process.exitCode = 1;
});
