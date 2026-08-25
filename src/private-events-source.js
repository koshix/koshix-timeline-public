import { parsePersonalEventsTsv } from "./personal-events-tsv";

export {
  parsePersonalEventsTsv as parsePrivateEventsTsv,
} from "./personal-events-tsv";

export async function loadPrivateEvents() {
  const res = await fetch(
    `${import.meta.env.BASE_URL}private/events.tsv`,
    {
      cache: "no-store",
      credentials: "same-origin",
    }
  );

  // Basic認証を通過しなかった場合は表示をONにしない。
  if (!res.ok) {
    return null;
  }

  const text = await res.text();
  const events = parsePersonalEventsTsv(text);

  console.info(
    `Runtime private events TSV loaded: ${events.length} events`
  );

  return events;
}
