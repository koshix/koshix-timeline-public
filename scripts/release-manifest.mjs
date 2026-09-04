import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultProjectRoot = path.resolve(scriptDir, "..");

function fail(message) {
  throw new Error(`release-manifest.json: ${message}`);
}

function isSemver(value) {
  return /^\d+\.\d+\.\d+$/.test(value);
}

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateReleaseManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    fail("JSON object ではありません");
  }

  if (manifest.schemaVersion !== 1) {
    fail(`schemaVersion は 1 である必要があります: ${manifest.schemaVersion}`);
  }

  if (!isSemver(manifest.version)) {
    fail(`version が不正です: ${manifest.version}`);
  }

  if (manifest.stableTag !== `v${manifest.version}`) {
    fail(
      `stableTag が version と一致しません: ${manifest.stableTag} / ${manifest.version}`
    );
  }

  if (!isDate(manifest.releaseDate)) {
    fail(`releaseDate が不正です: ${manifest.releaseDate}`);
  }

  if (!Number.isInteger(manifest.publicEvents) || manifest.publicEvents < 0) {
    fail(`publicEvents が不正です: ${manifest.publicEvents}`);
  }

  return manifest;
}

export function readReleaseManifest(projectRoot = defaultProjectRoot) {
  const manifestPath = path.join(projectRoot, "release-manifest.json");
  const text = fs.readFileSync(manifestPath, "utf8");

  let manifest;

  try {
    manifest = JSON.parse(text);
  } catch (error) {
    fail(`JSONを読めません: ${error.message}`);
  }

  return validateReleaseManifest(manifest);
}
