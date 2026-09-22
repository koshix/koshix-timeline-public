import {
  parsePublicEventsTsv,
} from "./public-events-tsv.js";

let currentEvents = null;

export function parseEventsTsv(text) {
  return parsePublicEventsTsv(text);
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
