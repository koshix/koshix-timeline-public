import assert from "node:assert/strict";

import {
  assessPublicReleaseState,
} from "../scripts/public-release-state.mjs";

const types = (state) =>
  assessPublicReleaseState(state).map(
    (item) => item.type
  );

// 正常なプレ公開。
// 4つの制限はすべて意図した blocker。
assert.deepEqual(
  types({
    publicDistributionEnabled: false,
    hasNoindex: true,
    downloadStatus: 401,
    publicSourceVisibility: "private",
    livePublicDistributionEnabled: false,
  }),
  [
    "expected",
    "expected",
    "expected",
    "expected",
  ]
);

// プレ公開中なのに4つの制限が解除された。
// すべて異常。
assert.deepEqual(
  types({
    publicDistributionEnabled: false,
    hasNoindex: false,
    downloadStatus: 200,
    publicSourceVisibility: "public",
    livePublicDistributionEnabled: true,
  }),
  [
    "blocked",
    "blocked",
    "blocked",
    "blocked",
  ]
);

// 正常な一般公開。
assert.deepEqual(
  types({
    publicDistributionEnabled: true,
    hasNoindex: false,
    downloadStatus: 200,
    publicSourceVisibility: "public",
    livePublicDistributionEnabled: true,
  }),
  [
    "ok",
    "ok",
    "ok",
    "ok",
  ]
);

// 一般公開設定なのにプレ公開制限が残っている。
// すべて異常。
assert.deepEqual(
  types({
    publicDistributionEnabled: true,
    hasNoindex: true,
    downloadStatus: 401,
    publicSourceVisibility: "private",
    livePublicDistributionEnabled: false,
  }),
  [
    "blocked",
    "blocked",
    "blocked",
    "blocked",
  ]
);

console.log(
  "OK: public release state transitions"
);
