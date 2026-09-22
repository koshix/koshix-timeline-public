import {
  decodeEventRow,
} from "./event-codec.js";
import {
  eventYear,
  PUBLIC_EVENT_TSV_HEADER,
  validatePublicEventRow,
} from "./event-schema.js";

export function parsePublicEventsTsv(
  text,
  {
    requireSourceOrder = false,
  } = {}
) {
  const normalized =
    String(text ?? "").replace(/\r\n/g, "\n");

  const lines = normalized
    .split("\n")
    .filter(
      (line) => line.trim() !== ""
    );

  if (lines.length < 2) {
    throw new Error(
      "events.tsv にデータ行がありません"
    );
  }

  const header = lines[0].split("\t");

  if (
    JSON.stringify(header) !==
    JSON.stringify(PUBLIC_EVENT_TSV_HEADER)
  ) {
    throw new Error(
      "events.tsv のヘッダーが一致しません"
    );
  }

  const ids = new Set();
  const events = [];
  let previousSourceEvent = null;

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cols = lines[i].split("\t");

    if (
      cols.length !==
      PUBLIC_EVENT_TSV_HEADER.length
    ) {
      throw new Error(
        `${lineNo}行目: 列数が ${cols.length}。` +
        `${PUBLIC_EVENT_TSV_HEADER.length}列必要です`
      );
    }

    const row = Object.fromEntries(
      PUBLIC_EVENT_TSV_HEADER.map(
        (key, j) => [
          key,
          cols[j].trim(),
        ]
      )
    );

    try {
      validatePublicEventRow(row);
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
      requireSourceOrder &&
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
      decodeEventRow(row)
    );
  }

  events.sort(
    (a, b) =>
      eventYear(a) - eventYear(b) ||
      a.date.localeCompare(b.date) ||
      a.title.localeCompare(
        b.title,
        "ja"
      )
  );

  return events;
}
