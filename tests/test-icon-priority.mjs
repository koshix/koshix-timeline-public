import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  SUB_ICON_PRIORITY,
  PUBLIC_EVENT_ICON_NAMES,
  resolvePublicEventIcon,
} from "../src/event-icon.js";

test("representative icon priority remains fixed", () => {
  assert.deepEqual(SUB_ICON_PRIORITY, ["game","architecture","revolution","religion","design","stage","communication","media","environment","industry","space","life","war","biomed","math","law","visual","economy","music","matter","rights","thought","art","politics","technology","literature"]);
});

test("game uses its own representative icon", () => {
  assert.equal(PUBLIC_EVENT_ICON_NAMES.has("game"), true);

  for (const subs of [
    ["game"],
    ["visual", "game"],
    ["industry", "game"],
    ["technology", "game"],
  ]) {
    assert.equal(
      resolvePublicEventIcon({
        primary: "computer",
        subs,
      }),
      "game"
    );
  }
});

test("architecture covers buildings and urban planning", () => {
  assert.equal(
    PUBLIC_EVENT_ICON_NAMES.has("architecture"),
    true
  );

  const text = readFileSync(
    new URL("../public/events.tsv", import.meta.url),
    "utf8"
  );

  const [headerLine, ...lines] = text
    .trimEnd()
    .split(/\r?\n/);

  const header = headerLine.replace(/^\uFEFF/, "").split("\t");
  const idIndex = header.indexOf("id");
  const subsIndex = header.indexOf("subs");
  const primaryIndex = header.indexOf("primary");

  let count = 0;
  const ids = new Set();

  for (const line of lines) {
    const cells = line.split("\t");
    const subs = cells[subsIndex].split("|").filter(Boolean);

    if (!subs.includes("architecture")) continue;

    count++;
    ids.add(cells[idIndex]);

    assert.equal(
      resolvePublicEventIcon({
        id: cells[idIndex],
        primary: cells[primaryIndex],
        subs,
      }),
      "architecture",
      cells[idIndex]
    );
  }

  assert.ok(count >= 16);
  assert.ok(ids.has("1898-howard-garden-city"));
  assert.ok(ids.has("1961-jane-jacobs-cities"));
  assert.ok(ids.has("1615-katsura-villa"));
});

test("religion icon priority covers 24 of 30 events", () => {
  assert.equal(PUBLIC_EVENT_ICON_NAMES.has("religion"), true);
  assert.equal(SUB_ICON_PRIORITY.length, 26);

  const text = readFileSync(
    new URL("../public/events.tsv", import.meta.url),
    "utf8"
  );

  const [headerLine, ...lines] = text.trimEnd().split(/\r?\n/);
  const header = headerLine.replace(/^\uFEFF/, "").split("\t");

  const idIndex = header.indexOf("id");
  const subsIndex = header.indexOf("subs");
  const primaryIndex = header.indexOf("primary");

  const counts = new Map();
  let total = 0;

  for (const line of lines) {
    const cells = line.split("\t");
    const subs = cells[subsIndex].split("|").filter(Boolean);

    if (!subs.includes("religion")) continue;
    total++;

    const icon = resolvePublicEventIcon({
      id: cells[idIndex],
      primary: cells[primaryIndex],
      subs,
    });

    counts.set(icon, (counts.get(icon) ?? 0) + 1);
  }

  assert.equal(total, 30);
  assert.equal(counts.get("religion"), 24);
  assert.equal(counts.get("architecture"), 5);
  assert.equal(counts.get("revolution"), 1);
  assert.equal(counts.size, 3);

  assert.equal(
    resolvePublicEventIcon({
      primary: "society",
      subs: ["religion"],
    }),
    "religion"
  );
});
