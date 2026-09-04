import {
  decodeEventRow,
  encodeEventRow,
} from "./event-codec.js";
import {
  PERSONAL_EVENT_TSV_HEADER,
  validatePersonalEventRow,
} from "./event-schema.js";

export const PERSONAL_EVENTS_HEADER =
  PERSONAL_EVENT_TSV_HEADER;

export function parsePersonalEventsTsv(text) {
  const normalized = String(text ?? "").replace(/\r\n/g, "\n");
  const lines = normalized
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    throw new Error("個人史 events.tsv にデータ行がありません");
  }

  const header = lines[0].split("\t");

  if (
    header.join("\t") !== PERSONAL_EVENTS_HEADER.join("\t")
  ) {
    throw new Error("個人史 events.tsv のヘッダーが想定と違います");
  }

  const ids = new Set();
  const events = [];
  let previousSourceEvent = null;

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cells = lines[i].split("\t");

    if (cells.length !== PERSONAL_EVENTS_HEADER.length) {
      throw new Error(
        `${lineNo}行目: 列数が ${cells.length}。` +
        `${PERSONAL_EVENTS_HEADER.length}列必要です`
      );
    }

    const row = Object.fromEntries(
      PERSONAL_EVENTS_HEADER.map((h, n) => [h, cells[n]])
    );

    try {
      validatePersonalEventRow(row);
    } catch (error) {
      throw new Error(
        `${lineNo}行目: ${error.message}`
      );
    }

    if (ids.has(row.id)) {
      throw new Error(
        `${lineNo}行目: id "${row.id}" が重複しています`
      );
    }
    ids.add(row.id);

    if (
      previousSourceEvent &&
      row.date < previousSourceEvent.date
    ) {
      throw new Error(
        `${lineNo}行目: date "${row.date}" (${row.title}) が ` +
        `${previousSourceEvent.lineNo}行目の date ` +
        `"${previousSourceEvent.date}" (${previousSourceEvent.title}) より前です`
      );
    }

    previousSourceEvent = {
      lineNo,
      date: row.date,
      title: row.title,
    };

    events.push(
      decodeEventRow(row, {
        forcePrimary: "me",
        defaultIcon: "flag",
      })
    );
  }

  events.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.t.localeCompare(b.t, "ja")
  );

  return events;
}

function cleanCell(value) {
  return String(value ?? "")
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();
}

export function serializePersonalEventsTsv(events) {
  const sorted = [...events].sort(
    (a, b) =>
      String(a.date ?? "").localeCompare(String(b.date ?? "")) ||
      String(a.t ?? a.title ?? "").localeCompare(
        String(b.t ?? b.title ?? ""),
        "ja"
      )
  );

  const lines = [
    PERSONAL_EVENTS_HEADER.join("\t"),
    ...sorted.map((event) => {
      const row = encodeEventRow(event, {
        forcePrimary: "me",
        defaultIcon: "flag",
      });

      return PERSONAL_EVENTS_HEADER
        .map((key) => cleanCell(row[key]))
        .join("\t");
    }),
  ];

  const text = `${lines.join("\n")}\n`;

  // 書き出したTSV自身が読み戻せることを保証する。
  parsePersonalEventsTsv(text);

  return text;
}
