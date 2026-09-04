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
    "examples/config.json",
  "examples/personal-events-template.tsv",
  "examples/STARTER-README.md",
  "DATA-GUIDE.md",
  "LICENSE",
  "THIRD-PARTY-NOTICES.md",
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const reproducibleZipDate = new Date(2000, 0, 1, 0, 0, 0);

function normalizeArchiveTimestamps(rootDir) {
  function visit(currentPath) {
    const stat = fs.statSync(currentPath);

    if (stat.isDirectory()) {
      const names = fs.readdirSync(currentPath).sort();

      for (const name of names) {
        visit(path.join(currentPath, name));
      }
    }

    fs.utimesSync(
      currentPath,
      reproducibleZipDate,
      reproducibleZipDate
    );
  }

  visit(rootDir);
}

function collectArchiveEntries(rootDir) {
  const entries = [`${starterName}/`];

  function visit(currentDir) {
    const dirents = fs
      .readdirSync(currentDir, { withFileTypes: true })
      .sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });

    for (const entry of dirents) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path
        .relative(releaseDir, fullPath)
        .split(path.sep)
        .join("/");

      if (entry.isDirectory()) {
        entries.push(`${relativePath}/`);
        visit(fullPath);
      } else {
        entries.push(relativePath);
      }
    }
  }

  visit(rootDir);
  return entries;
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

    if (path.basename(sourcePath) === ".DS_Store") return false;
    return true;
  },
});

fs.copyFileSync(
  path.join(projectRoot, "examples/config.json"),
  path.join(stageDir, "config.json")
);

fs.mkdirSync(path.join(stageDir, "personal"), { recursive: true });
fs.copyFileSync(
  path.join(projectRoot, "examples/personal-events-template.tsv"),
  path.join(stageDir, "personal/personal-events.tsv")
);

fs.mkdirSync(path.join(stageDir, "examples"), { recursive: true });
fs.copyFileSync(
  path.join(projectRoot, "examples/personal-events-template.tsv"),
  path.join(stageDir, "examples/personal-events-template.tsv")
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
  path.join(projectRoot, "examples/personal-events-template.tsv")
);
const stagedPrivateFile = fs.readFileSync(
  path.join(stageDir, "personal/personal-events.tsv")
);

if (!privateTemplate.equals(stagedPrivateFile)) {
  fail("personal/personal-events.tsv が空テンプレートと一致しません");
}

normalizeArchiveTimestamps(stageDir);

const archiveEntries = collectArchiveEntries(stageDir);

const zipResult = spawnSync(
  "/usr/bin/zip",
  ["-X", "-q", zipPath, "-@"],
  {
    cwd: releaseDir,
    input: `${archiveEntries.join("\n")}\n`,
    stdio: ["pipe", "inherit", "inherit"],
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
  ["-p", zipPath, `${starterName}/personal/personal-events.tsv`]
);

if (zipPrivateResult.status !== 0) {
  fs.rmSync(zipPath, { force: true });
  fail("zip内の personal/personal-events.tsv を検査できませんでした");
}

if (!privateTemplate.equals(zipPrivateResult.stdout)) {
  fs.rmSync(zipPath, { force: true });
  fail("zip内の personal/personal-events.tsv に実データが混入しています");
}

if (entries.some((entry) => path.basename(entry) === ".DS_Store")) {
  fs.rmSync(zipPath, { force: true });
  fail("zipに .DS_Store が混入しました");
}

console.log(`OK: ${zipPath}`);
console.log(`OK: ${entries.length}項目を検査しました`);
console.log("OK: personal/personal-events.tsv は空テンプレートと一致します");
