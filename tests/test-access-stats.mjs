import assert from "node:assert/strict";

import {
  ACCESS_VISITOR_DATE_KEY,
  formatTokyoDate,
  recordAccess,
} from "../src/access-stats.js";

assert.equal(
  formatTokyoDate(
    new Date("2026-09-05T14:59:59Z")
  ),
  "2026-09-05"
);

assert.equal(
  formatTokyoDate(
    new Date("2026-09-05T15:00:00Z")
  ),
  "2026-09-06"
);

const values = new Map();

const storage = {
  getItem(key) {
    return values.has(key)
      ? values.get(key)
      : null;
  },

  setItem(key, value) {
    values.set(key, value);
  },
};

const calls = [];

const fetchImpl = async (url, options) => {
  calls.push({ url, options });

  return {
    ok: true,
    status: 204,
  };
};

const now = new Date("2026-09-05T03:00:00Z");

const first = await recordAccess({
  endpoint: "counter/hit.php",
  storage,
  fetchImpl,
  now,
});

assert.equal(first.sent, true);
assert.equal(first.visitor, true);
assert.equal(first.status, 204);

assert.equal(calls.length, 1);
assert.equal(calls[0].url, "counter/hit.php");
assert.equal(calls[0].options.method, "POST");
assert.equal(calls[0].options.body, "visitor=1");

assert.deepEqual(
  [...new URLSearchParams(
    calls[0].options.body
  ).keys()],
  ["visitor"]
);

assert.equal(
  storage.getItem(ACCESS_VISITOR_DATE_KEY),
  "2026-09-05"
);

const second = await recordAccess({
  endpoint: "counter/hit.php",
  storage,
  fetchImpl,
  now,
});

assert.equal(second.sent, true);
assert.equal(second.visitor, false);
assert.equal(calls.length, 2);
assert.equal(calls[1].options.body, "visitor=0");

const disabled = await recordAccess({
  endpoint: "",
  storage,
  fetchImpl,
  now,
});

assert.equal(disabled.sent, false);
assert.equal(calls.length, 2);

console.log(
  "OK: access statsの日別visitor判定・POST内容・無効設定を検査しました"
);
