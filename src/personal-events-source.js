import { parsePersonalEventsTsv } from "./personal-events-tsv";

export async function loadPersonalEvents() {
  const res = await fetch(
    `${import.meta.env.BASE_URL}personal/personal-events.tsv`,
    {
      cache: "no-store",
      credentials: "same-origin",
    }
  );

  // 認証を通過しなかった場合や個人史がない場合は表示しない。
  if (!res.ok) {
    return null;
  }

  const text = await res.text();
  const events = parsePersonalEventsTsv(text);

  console.info(
    `Runtime personal events TSV loaded: ${events.length} events`
  );

  return events;
}
