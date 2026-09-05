export const ACCESS_VISITOR_DATE_KEY =
  "koshix-timeline-access-visitor-date";

export function formatTokyoDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat(
    "en",
    {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export async function recordAccess({
  endpoint = "",
  storage =
    typeof window !== "undefined"
      ? window.localStorage
      : null,
  fetchImpl =
    typeof fetch === "function"
      ? fetch
      : null,
  now = new Date(),
} = {}) {
  const url = String(endpoint || "").trim();

  if (!url || typeof fetchImpl !== "function") {
    return {
      sent: false,
      visitor: false,
      status: null,
    };
  }

  const today = formatTokyoDate(now);
  let visitor = false;

  if (storage) {
    try {
      visitor =
        storage.getItem(ACCESS_VISITOR_DATE_KEY) !== today;
    } catch {
      visitor = false;
    }
  }

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: `visitor=${visitor ? "1" : "0"}`,
      cache: "no-store",
      keepalive: true,
      credentials: "same-origin",
    });

    if (!response.ok) {
      return {
        sent: false,
        visitor,
        status: response.status,
      };
    }

    if (visitor && storage) {
      try {
        storage.setItem(
          ACCESS_VISITOR_DATE_KEY,
          today
        );
      } catch {
        // 集計自体は成功しているため、保存失敗は無視する。
      }
    }

    return {
      sent: true,
      visitor,
      status: response.status,
    };
  } catch {
    // アクセス統計の失敗でアプリ本体を止めない。
    return {
      sent: false,
      visitor,
      status: null,
    };
  }
}
