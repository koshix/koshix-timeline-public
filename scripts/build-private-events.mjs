import fs from "node:fs";
import { parsePersonalEventsTsv } from "../src/personal-events-tsv.js";

const INPUT = "public/private/events.tsv";

if (!fs.existsSync(INPUT)) {
  console.log(`WARN: ${INPUT} がありません`);
  console.log("個人史TSVの検査をスキップします");
  process.exit(0);
}

const text = fs.readFileSync(INPUT, "utf8");
const events = parsePersonalEventsTsv(text);

console.log(`OK: 個人史 ${events.length}件を検査しました`);
