import fs from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  PUBLIC_EVENT_TSV_HEADER,
  isValidEventDate,
} from "../src/event-schema.js";

import {
  clean,
  eventId,
  readRows,
  runBuilder,
} from "./event-entry-core.mjs";

const TSV = "public/events.tsv";
const CATEGORIES = {
  sf: "SF",
  science: "数学・物理学",
  education: "日本の教育",
  computer: "コンピュータ・インターネット・AI",
  culture: "文化・流行",
  society: "政治・経済・社会・国際",
};

const ICONS = [
  "book", "tv", "film", "robot", "watch", "comm",
  "computer", "chip", "globe", "satellite", "rocket",
  "hmd", "gamepad", "phone", "video", "ai", "ghost",
  "music", "wifi", "flag",
];

function splitKeys(s) {
  return [...new Set(
    s.split(/[|,、\s]+/).map(x => x.trim()).filter(Boolean)
  )];
}

function yearFromDate(date) {
  if (!isValidEventDate(date)) {
    throw new Error(
      "date は YYYY / YYYY-MM / YYYY-MM-DD の形式で入力してください"
    );
  }
  return Number(date.slice(0, 4));
}

async function main() {
  if (!fs.existsSync(TSV)) {
    throw new Error(`${TSV} が見つかりません`);
  }

  const original = fs.readFileSync(TSV, "utf8");
  const rows = readRows(original);

  console.log("\nKoshix Timeline — 新規イベント追加\n");

  console.log("大分類:");
  for (const [key, label] of Object.entries(CATEGORIES)) {
    console.log(`  ${key.padEnd(10)} ${label}`);
  }

  console.log("");

  const rl = createInterface({ input, output });

  try {
    const date = clean(
      await rl.question("date [YYYY / YYYY-MM / YYYY-MM-DD]: ")
    );

    const year = yearFromDate(date);

    const endDate = clean(
      await rl.question("end_date [任意]: ")
    );

    if (endDate && !isValidEventDate(endDate)) {
      throw new Error(
        "end_date は YYYY / YYYY-MM / YYYY-MM-DD の形式で入力してください"
      );
    }

    const title = clean(
      await rl.question("title: ")
    );

    if (!title) {
      throw new Error("title は必須です");
    }

    const cats = splitKeys(
      clean(
        await rl.question(
          "cats [例: computer / computer,culture]: "
        )
      )
    );

    if (!cats.length) {
      throw new Error("cats は1つ以上必要です");
    }

    const badCats = cats.filter(k => !CATEGORIES[k]);

    if (badCats.length) {
      throw new Error(
        `未知の大分類: ${badCats.join(", ")}`
      );
    }

    const primaryInput = clean(
      await rl.question(
        `primary [Enter=${cats[0]}]: `
      )
    );

    const primary = primaryInput || cats[0];

    if (!cats.includes(primary)) {
      throw new Error(
        "primary は cats に含まれている必要があります"
      );
    }

    const subs = splitKeys(
      clean(
        await rl.question(
          "subs [任意・複数はカンマ区切り]: "
        )
      )
    ).join("|");

    const region = clean(
      await rl.question("region [任意]: ")
    );

    const importanceInput = clean(
      await rl.question(
        "importance [1-3, Enter=2]: "
      )
    );

    const importance = importanceInput || "2";

    if (!["1", "2", "3"].includes(importance)) {
      throw new Error(
        "importance は 1, 2, 3 のいずれかです"
      );
    }

    console.log(`icons: ${ICONS.join(", ")}`);

    const iconInput = clean(
      await rl.question("icon [Enter=book]: ")
    );

    const icon = iconInput || "book";

    if (!ICONS.includes(icon)) {
      throw new Error(`未知の icon: ${icon}`);
    }

    const summary = clean(
      await rl.question("summary: ")
    );

    if (!summary) {
      throw new Error("summary は必須です");
    }

    console.log(`
sources を1件ずつ入力します。空Enterで終了。

外部URL:
  https://example.com/page::表示名

日本語Wikipedia:
  記事名
  記事名::表示名

英語Wikipedia:
  en:Article_name::表示名
`);

    const sources = [];

    while (true) {
      const s = clean(
        await rl.question(
          `source ${sources.length + 1}: `
        )
      );

      if (!s) break;
      sources.push(s);
    }

    const search = clean(
      await rl.question(
        "search [Amazon/YouTube用・任意]: "
      )
    );

    const note = clean(
      await rl.question("note [任意]: ")
    );

    const id = eventId(year, title);

    if (rows.some(r => r.id === id)) {
      throw new Error(
        `同じ id がすでにあります: ${id}`
      );
    }

    if (
      rows.some(
        r => r.date === date && r.title === title
      )
    ) {
      throw new Error(
        `同じ date + title がすでにあります: ${date} ${title}`
      );
    }

    const row = {
      id,
      date,
      end_date: endDate,
      title,
      cats: cats.join("|"),
      primary,
      subs,
      region,
      importance,
      icon,
      summary,
      sources: sources.join("|"),
      search,
      note,
    };

    console.log("\n追加内容:");
    console.log(`  id         ${row.id}`);
    console.log(`  date       ${row.date}`);
    console.log(`  title      ${row.title}`);
    console.log(`  cats       ${row.cats}`);
    console.log(`  primary    ${row.primary}`);
    console.log(`  subs       ${row.subs || "(空)"}`);
    console.log(`  region     ${row.region || "(空)"}`);
    console.log(`  importance ${row.importance}`);
    console.log(`  icon       ${row.icon}`);
    console.log(`  summary    ${row.summary}`);
    console.log(`  sources    ${row.sources || "(空)"}`);
    console.log(`  search     ${row.search || "(空)"}`);
    console.log(`  note       ${row.note || "(空)"}`);

    const answer = clean(
      await rl.question(
        "\nこの内容で追加しますか? [y/N]: "
      )
    ).toLowerCase();

    if (!["y", "yes"].includes(answer)) {
      console.log("追加を中止しました。");
      return;
    }

    const line = PUBLIC_EVENT_TSV_HEADER
      .map(k => row[k])
      .join("\t");

    const base = original.endsWith("\n")
      ? original
      : original + "\n";

    fs.writeFileSync(
      TSV,
      base + line + "\n",
      "utf8"
    );

    console.log(
      "\nbuild-events.mjs で検査します…"
    );

    if (!runBuilder()) {
      console.error(
        "\n検査に失敗したため events.tsv を元に戻します。"
      );

      fs.writeFileSync(
        TSV,
        original,
        "utf8"
      );

      process.exitCode = 1;
      return;
    }

    console.log(
      `\nOK: ${row.id} を追加しました。`
    );

    console.log(
      "次は npm run dev で表示確認してください。"
    );

  } finally {
    rl.close();
  }
}

main().catch(err => {
  console.error(`\nERROR: ${err.message}`);
  process.exitCode = 1;
});
