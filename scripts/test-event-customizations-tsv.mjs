import assert from "node:assert/strict";

import {
  parseEventCustomizationsTsv,
  serializeEventCustomizationsTsv,
} from "../src/event-customizations-tsv.js";

const source = {
  overrides: {
    "1839-daguerreotype-public": {
      title: "修正後のタイトル",
      importance: 3,
      note: null,
      cats: ["culture", "science"],
    },
  },
  hidden: [
    "1843-lovelace-notes",
  ],
  additions: [
    {
      id: "custom-test",
      date: "2026-08-25",
      title: "追加テスト",
      cats: ["science"],
      primary: "science",
      importance: 2,
      icon: "chip",
      summary: "改行\nとタブ\tを含む概要",
    },
  ],
};

const text = serializeEventCustomizationsTsv(source);
const parsed = parseEventCustomizationsTsv(text);

assert.deepEqual(
  parsed.overrides,
  source.overrides
);

assert.deepEqual(
  parsed.hidden,
  source.hidden
);

assert.deepEqual(
  parsed.additions,
  source.additions
);

assert.match(
  text,
  /^action\tid\tfield\tvalue_json\n/
);

assert.ok(
  text.includes(
    'override\t1839-daguerreotype-public\ttitle\t"修正後のタイトル"'
  )
);

assert.ok(
  text.includes(
    "hide\t1843-lovelace-notes\t\t"
  )
);

assert.ok(
  text.includes(
    'add\tcustom-test\tsummary\t"改行\\nとタブ\\tを含む概要"'
  )
);

assert.throws(
  () =>
    parseEventCustomizationsTsv(
      "action\tid\tfield\tvalue_json\n" +
      "unknown\tx\ttitle\t\"x\"\n"
    ),
  /action "unknown" は未対応/
);

assert.throws(
  () =>
    parseEventCustomizationsTsv(
      "action\tid\tfield\tvalue_json\n" +
      "override\tx\tunknown\t1\n"
    ),
  /field "unknown" は未対応/
);

assert.throws(
  () =>
    serializeEventCustomizationsTsv({
      overrides: {},
      hidden: [],
      additions: [
        {
          id: "legacy-cat",
          date: "2026",
              title: "旧cat検査",
          cats: ["science"],
          primary: "science",
          cat: "science",
          importance: 2,
          icon: "chip",
          summary: "旧catは許可しない",
        },
      ],
    }),
  /未対応の内部フィールド "cat"/
);

console.log("OK: event customizations TSV");
console.log(
  `rows: ${text.trimEnd().split("\n").length - 1}`
);
