import assert from "node:assert/strict";

import {
  PUBLIC_EVENT_TSV_HEADER,
} from "../src/event-schema.js";
import {
  parsePublicEventsTsv,
} from "../src/public-events-tsv.js";

function row({
  id,
  date,
  title,
  primary = "science",
  cats = primary,
  subs = "",
}) {
  const values = {
    id,
    date,
    end_date: "",
    title,
    cats,
    primary,
    subs,
    region: "",
    importance: "2",
    summary: `${title}の要約`,
    sources: "",
    search: "",
    note: "",
  };

  return PUBLIC_EVENT_TSV_HEADER
    .map((key) => values[key])
    .join("\t");
}

function tsv(rows) {
  return [
    PUBLIC_EVENT_TSV_HEADER.join("\t"),
    ...rows,
    "",
  ].join("\n");
}

// Runtime側は元TSVが順不同でも年代順に正規化する。
{
  const events =
    parsePublicEventsTsv(
      tsv([
        row({
          id: "later",
          date: "2001",
          title: "後",
        }),
        row({
          id: "earlier",
          date: "2000",
          title: "前",
        }),
      ])
    );

  assert.deepEqual(
    events.map(
      (event) => event.id
    ),
    [
      "earlier",
      "later",
    ]
  );
}

// Build側は正本TSVの年代逆転を拒否する。
assert.throws(
  () =>
    parsePublicEventsTsv(
      tsv([
        row({
          id: "later",
          date: "2001",
          title: "後",
        }),
        row({
          id: "earlier",
          date: "2000",
          title: "前",
        }),
      ]),
      {
        requireSourceOrder: true,
      }
    ),
  /date "2000".*より前/
);

// 正しい年代順ならbuild用厳格モードでも通る。
assert.equal(
  parsePublicEventsTsv(
    tsv([
      row({
        id: "earlier",
        date: "2000",
        title: "前",
      }),
      row({
        id: "later",
        date: "2001",
        title: "後",
      }),
    ]),
    {
      requireSourceOrder: true,
    }
  ).length,
  2
);

// 永久ID重複を拒否する。
assert.throws(
  () =>
    parsePublicEventsTsv(
      tsv([
        row({
          id: "same",
          date: "2000",
          title: "一",
        }),
        row({
          id: "same",
          date: "2001",
          title: "二",
        }),
      ])
    ),
  /id "same" が重複/
);

// schema検査も共通parserから必ず通る。
assert.throws(
  () =>
    parsePublicEventsTsv(
      tsv([
        row({
          id: "bad-primary",
          date: "2000",
          title: "不正",
          cats: "work|sf",
          primary: "sf",
        }),
      ])
    ),
  /primary "sf" が不正/
);

// ヘッダー不一致を拒否する。
assert.throws(
  () =>
    parsePublicEventsTsv(
      "id\tdate\nx\t2000\n"
    ),
  /ヘッダーが一致/
);

// データなしを拒否する。
assert.throws(
  () =>
    parsePublicEventsTsv(
      `${PUBLIC_EVENT_TSV_HEADER.join("\t")}\n`
    ),
  /データ行がありません/
);

console.log(
  "OK: public events TSV canonical parser"
);
