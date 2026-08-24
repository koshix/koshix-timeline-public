import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const distDir = path.join(projectRoot, "dist");
const releaseDir = path.join(projectRoot, "release");
const starterName = "koshix-timeline-starter";
const stageDir = path.join(releaseDir, starterName);
const zipPath = path.join(releaseDir, `${starterName}.zip`);

const requiredSourceFiles = [
  "dist/index.html",
  "dist/assets",
  "dist/events.tsv",
  "dist/icons.svg",
  "dist/favicon.svg",
  "dist/private/auth-check.txt",
  "examples/config.json",
  "examples/private-events.tsv",
  "examples/STARTER-README.md",
  "DATA-GUIDE.md",
  "LICENSE",
  "THIRD-PARTY-NOTICES.md",
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

fs.mkdirSync(releaseDir, { recursive: true });
fs.rmSync(stageDir, { recursive: true, force: true });
fs.rmSync(zipPath, { force: true });

for (const relativePath of requiredSourceFiles) {
  if (!fs.existsSync(path.join(projectRoot, relativePath))) {
    fail(`${relativePath} がありません`);
  }
}

fs.cpSync(distDir, stageDir, {
  recursive: true,
  filter(sourcePath) {
    const relativePath = path
      .relative(distDir, sourcePath)
      .split(path.sep)
      .join("/");

    if (relativePath === "private/events.tsv") return false;
    if (path.basename(sourcePath) === ".DS_Store") return false;
    return true;
  },
});

fs.copyFileSync(
  path.join(projectRoot, "examples/config.json"),
  path.join(stageDir, "config.json")
);

fs.mkdirSync(path.join(stageDir, "private"), { recursive: true });
fs.copyFileSync(
  path.join(projectRoot, "examples/private-events.tsv"),
  path.join(stageDir, "private/events.tsv")
);

fs.mkdirSync(path.join(stageDir, "examples"), { recursive: true });
fs.copyFileSync(
  path.join(projectRoot, "examples/private-events.tsv"),
  path.join(stageDir, "examples/private-events.tsv")
);

fs.copyFileSync(
  path.join(projectRoot, "examples/STARTER-README.md"),
  path.join(stageDir, "README.md")
);

for (const fileName of [
  "DATA-GUIDE.md",
  "LICENSE",
  "THIRD-PARTY-NOTICES.md",
]) {
  fs.copyFileSync(
    path.join(projectRoot, fileName),
    path.join(stageDir, fileName)
  );
}

const privateTemplate = fs.readFileSync(
  path.join(projectRoot, "examples/private-events.tsv")
);
const stagedPrivateFile = fs.readFileSync(
  path.join(stageDir, "private/events.tsv")
);

if (!privateTemplate.equals(stagedPrivateFile)) {
  fail("private/events.tsv が空テンプレートと一致しません");
}

const zipResult = spawnSync(
  "/usr/bin/zip",
  ["-q", "-r", zipPath, starterName],
  {
    cwd: releaseDir,
    stdio: "inherit",
  }
);

if (zipResult.status !== 0) {
  fail("zip の作成に失敗しました");
}

const listResult = spawnSync(
  "/usr/bin/unzip",
  ["-Z1", zipPath],
  { encoding: "utf8" }
);

if (listResult.status !== 0) {
  fail("作成したzipの検査に失敗しました");
}

const entries = listResult.stdout
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const zipPrivateResult = spawnSync(
  "/usr/bin/unzip",
  ["-p", zipPath, `${starterName}/private/events.tsv`]
);

if (zipPrivateResult.status !== 0) {
  fs.rmSync(zipPath, { force: true });
  fail("zip内の private/events.tsv を検査できませんでした");
}

if (!privateTemplate.equals(zipPrivateResult.stdout)) {
  fs.rmSync(zipPath, { force: true });
  fail("zip内の private/events.tsv に実データが混入しています");
}

if (entries.some((entry) => path.basename(entry) === ".DS_Store")) {
  fs.rmSync(zipPath, { force: true });
  fail("zipに .DS_Store が混入しました");
}

console.log(`OK: ${zipPath}`);
console.log(`OK: ${entries.length}項目を検査しました`);
console.log("OK: private/events.tsv は空テンプレートと一致します");
