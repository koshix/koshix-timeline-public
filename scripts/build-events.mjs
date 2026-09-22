import fs from "node:fs";

import {
  parsePublicEventsTsv,
} from "../src/public-events-tsv.js";

const INPUT = "public/events.tsv";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(INPUT)) {
  fail(`${INPUT} がありません`);
}

const text =
  fs.readFileSync(INPUT, "utf8");

let events;

try {
  events = parsePublicEventsTsv(
    text,
    {
      requireSourceOrder: true,
    }
  );
} catch (error) {
  fail(error.message);
}

console.log(
  `OK: ${events.length}件を検査しました`
);
