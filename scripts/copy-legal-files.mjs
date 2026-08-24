import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const distDir = path.join(projectRoot, "dist");

if (!fs.existsSync(distDir)) {
  console.error("ERROR: dist がありません。先にViteのビルドが必要です。");
  process.exit(1);
}

const files = [
  ["LICENSE", "LICENSE.txt"],
  ["THIRD-PARTY-NOTICES.md", "THIRD-PARTY-NOTICES.md"],
];

for (const [source, destination] of files) {
  fs.copyFileSync(
    path.join(projectRoot, source),
    path.join(distDir, destination)
  );
  console.log(`copied: ${destination}`);
}
