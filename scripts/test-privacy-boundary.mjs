import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PERSONAL_EVENT_TSV_HEADER } from "../src/event-schema.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const requireDist = process.argv.includes("--require-dist");

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function isGitWorkTree() {
  const result = spawnSync(
    "git",
    ["rev-parse", "--is-inside-work-tree"],
    {
      cwd: projectRoot,
      encoding: "utf8",
    }
  );

  return result.status === 0 && result.stdout.trim() === "true";
}

function trackedFiles(pathspec) {
  const result = spawnSync(
    "git",
    ["ls-files", "-z", "--", pathspec],
    {
      cwd: projectRoot,
      encoding: "utf8",
    }
  );

  if (result.status !== 0) {
    fail(`git ls-files に失敗しました: ${pathspec}`);
  }

  return result.stdout
    .split("\0")
    .filter(Boolean)
    .sort();
}

function walkFiles(dir) {
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function sha256(filePath) {
  return createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

const privateDir = path.join(projectRoot, "private-data");

if (isGitWorkTree()) {
  const trackedPrivateFiles = trackedFiles("private-data");

  if (trackedPrivateFiles.length > 0) {
    fail(
      `private-data/ にGit追跡ファイルがあります: ${trackedPrivateFiles.join(", ")}`
    );
  }
} else if (fs.existsSync(privateDir)) {
  fail("公開用ソースに private-data/ が含まれています");
}

for (const relativePath of [
  "public/personal",
  "public/private",
]) {
  if (fs.existsSync(path.join(projectRoot, relativePath))) {
    fail(`公開入力領域に個人史用ディレクトリがあります: ${relativePath}`);
  }
}

const templatePath = path.join(
  projectRoot,
  "examples/personal-events-template.tsv"
);

if (!fs.existsSync(templatePath)) {
  fail("examples/personal-events-template.tsv がありません");
}

const templateRows = fs
  .readFileSync(templatePath, "utf8")
  .trimEnd()
  .split(/\r?\n/)
  .filter(Boolean);

if (templateRows.length !== 1) {
  fail("personal-events-template.tsv はヘッダーだけでなければなりません");
}

const expectedHeader = PERSONAL_EVENT_TSV_HEADER.join("\t");

if (templateRows[0] !== expectedHeader) {
  fail("personal-events-template.tsv のヘッダーが個人史schemaと一致しません");
}

console.log("OK: private-data/ にGit追跡ファイルはありません");
console.log("OK: 公開入力領域に個人史TSV用ディレクトリはありません");
console.log("OK: personal-events-template.tsv はschema一致の空テンプレートです");

if (!requireDist) {
  process.exit(0);
}

const distDir = path.join(projectRoot, "dist");

if (!fs.existsSync(distDir)) {
  fail("dist/ がありません。先にproduction buildが必要です");
}

for (const relativePath of [
  "personal",
  "private",
  "private-data",
]) {
  if (fs.existsSync(path.join(distDir, relativePath))) {
    fail(`production build に個人史領域が混入しています: dist/${relativePath}`);
  }
}

const privateFile = path.join(
  privateDir,
  "personal-events.tsv"
);

if (fs.existsSync(privateFile)) {
  const privateHash = sha256(privateFile);
  const copiedPrivateFile = walkFiles(distDir).find(
    (filePath) => sha256(filePath) === privateHash
  );

  if (copiedPrivateFile) {
    fail(
      `production build に実個人史と同一内容のファイルがあります: ${path.relative(
        projectRoot,
        copiedPrivateFile
      )}`
    );
  }
}

console.log("OK: production build に個人史領域はありません");
console.log("OK: production build に実個人史の直接コピーはありません");
