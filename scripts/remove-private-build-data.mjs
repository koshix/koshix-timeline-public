import fs from "node:fs";

const TARGET = "dist/private/events.tsv";

if (fs.existsSync(TARGET)) {
  fs.rmSync(TARGET);
  console.log(`removed: ${TARGET}`);
} else {
  console.log(`OK: ${TARGET} はありません`);
}
