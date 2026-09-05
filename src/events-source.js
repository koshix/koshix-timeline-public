import { eventYear } from "./event-schema.js";
import {
  decodeEventRow,
} from "./event-codec.js";
import {
  PUBLIC_EVENT_TSV_HEADER,
  validatePublicEventRow,
} from "./event-schema.js";

let currentEvents = null;

export function parseEventsTsv(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("events.tsv にデータ行がありません");
  }

  const header = lines[0].split("\t");

  if (
    JSON.stringify(header) !==
    JSON.stringify(PUBLIC_EVENT_TSV_HEADER)
  ) {
    throw new Error("events.tsv のヘッダーが一致しません");
  }

  const ids = new Set();
  const events = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cols = lines[i].split("\t");

    if (cols.length !== PUBLIC_EVENT_TSV_HEADER.length) {
      throw new Error(
        `${lineNo}行目: 列数が ${cols.length}。` +
        `${PUBLIC_EVENT_TSV_HEADER.length}列必要です`
      );
    }

    const row = Object.fromEntries(
      PUBLIC_EVENT_TSV_HEADER.map(
        (key, j) => [key, cols[j].trim()]
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

    events.push(
      decodeEventRow(row, {
        includeCore: true,
      })
    );
  }

  events.sort(
    (a, b) =>
      eventYear(a) - eventYear(b) ||
      a.date.localeCompare(b.date) ||
      a.title.localeCompare(b.title, "ja")
  );

  return events;
}

/*
 * 公開イベントをランタイムで準備する。
 *
 * public/events.tsv を唯一の公開イベント源として読み込み、検査する。
 * 読み込みや検査に失敗した場合は例外を上位へ渡す。
 */
export async function prepareEvents() {
  const res = await fetch(
    `${import.meta.env.BASE_URL}events.tsv`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(
      `events.tsv の読み込みに失敗しました: HTTP ${res.status}`
    );
  }

  const text = await res.text();
  const events = parseEventsTsv(text);

  currentEvents = events;
  console.info(
    `Runtime events TSV loaded: ${events.length} events`
  );
}

/*
 * App.jsx から見た公開イベントの取得窓口。
 * prepareEvents() 完了後に呼ばれるため、通常はTSV版を返す。
 */
export function loadEvents() {
  if (currentEvents === null) {
    throw new Error(
      "公開イベントがまだ準備されていません"
    );
  }
  return currentEvents;
}
