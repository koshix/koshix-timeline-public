import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  PUBLIC_EVENT_ICON_NAMES,
  resolvePublicEventIcon,
} from "../src/event-icon.js";

function readPublicEvents() {
  const text = fs.readFileSync(
    new URL("../public/events.tsv", import.meta.url),
    "utf8"
  );

  const [headerLine, ...lines] = text
    .trimEnd()
    .split("\n");

  const header = headerLine.split("\t");
  const index = Object.fromEntries(
    header.map((name, i) => [name, i])
  );

  return lines.map((line) => {
    const cells = line.split("\t");

    return {
      id: cells[index.id],
      primary: cells[index.primary],
      subs: cells[index.subs]
        ? cells[index.subs].split("|")
        : [],
      region: cells[index.region] ?? "",
    };
  });
}

test("icons.svg contains exactly public semantic icons plus personal flag", () => {
  const svg = fs.readFileSync(
    new URL("../public/icons.svg", import.meta.url),
    "utf8"
  );

  const names = [
    ...svg.matchAll(
      /<symbol\b[^>]*\bid="icon-([^"]+)"/g
    ),
  ].map((match) => match[1]);

  const expected = [
    ...PUBLIC_EVENT_ICON_NAMES,
    "flag",
  ].sort();

  assert.equal(names.length, expected.length);
  assert.deepEqual(
    [...names].sort(),
    expected
  );
});

test("all public events resolve to semantic icons", () => {
  const events = readPublicEvents();

  for (const event of events) {
    const icon = resolvePublicEventIcon(event);

    assert.ok(
      PUBLIC_EVENT_ICON_NAMES.has(icon),
      `${event.id}: unknown icon ${icon}`
    );
  }
});

test("sub tag priority is stable", () => {
  assert.equal(
    resolvePublicEventIcon({
      id: "x",
      primary: "society",
      subs: ["politics", "war"],
      region: "日本",
    }),
    "war"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "x",
      primary: "work",
      subs: ["literature", "space"],
      region: "日本",
    }),
    "space"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "x",
      primary: "society",
      subs: ["politics", "rights", "revolution"],
      region: "世界",
    }),
    "revolution"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "x",
      primary: "society",
      subs: ["economy", "industry"],
      region: "世界",
    }),
    "industry"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "x",
      primary: "computer",
      subs: ["technology", "communication"],
      region: "世界",
    }),
    "communication"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "x",
      primary: "society",
      subs: ["rights", "law"],
      region: "世界",
    }),
    "law"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "x",
      primary: "society",
      subs: ["environment", "law"],
      region: "世界",
    }),
    "environment"
  );
});

test("split icon rules are stable", () => {
  assert.equal(
    resolvePublicEventIcon({
      id: "2022-1lh89p8",
      primary: "society",
      subs: ["politics"],
      region: "日本",
    }),
    "politics-japan"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "1685-revocation-edict-nantes",
      primary: "society",
      subs: ["rights"],
      region: "フランス・欧州",
    }),
    "rights-suppress"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "1789-declaration-rights-man",
      primary: "society",
      subs: ["rights"],
      region: "フランス・欧州・世界",
    }),
    "rights-expand"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "2004-graphene-isolation",
      primary: "science",
      subs: ["matter"],
      region: "世界",
    }),
    "matter-material"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "2012-8royp8",
      primary: "science",
      subs: ["matter"],
      region: "世界",
    }),
    "matter-physics"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "2020-13ara66",
      primary: "society",
      subs: ["life"],
      region: "世界",
    }),
    "life-health"
  );

  assert.equal(
    resolvePublicEventIcon({
      id: "1953-core75-16",
      primary: "science",
      subs: ["life"],
      region: "世界",
    }),
    "life-science"
  );
});

test("empty subs falls back to primary", () => {
  assert.equal(
    resolvePublicEventIcon({
      id: "x",
      primary: "computer",
      subs: [],
      region: "世界",
    }),
    "fallback-computer"
  );
});
