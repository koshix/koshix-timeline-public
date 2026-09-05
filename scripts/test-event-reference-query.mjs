import assert from "node:assert/strict";

import {
  buildWikipediaQuery,
} from "../src/event-reference-query.js";

const cases = [
  [
    "マイケル・クライトン『アンドロメダ病原体』刊行",
    "Michael Crichton Andromeda Strain 1969 Knopf microorganism Wildfire",
    "マイケル・クライトン アンドロメダ病原体",
  ],
  [
    "ル＝グウィン『闇の左手』刊行",
    "Ursula Le Guin Left Hand Darkness 1969 March Gethen gender",
    "ル＝グウィン 闇の左手",
  ],
  [
    "筒井康隆『虚人たち』刊行",
    "筒井康隆 虚人たち 1981年4月 中央公論社 メタフィクション",
    "筒井康隆 虚人たち",
  ],
  [
    "映画『AKIRA』公開",
    "AKIRA 1988年7月16日 大友克洋 ネオ東京 cyberpunk anime アキラ",
    "AKIRA",
  ],
  [
    "TSMC設立、半導体の専業ファウンドリーモデルを確立",
    "TSMC founded February 21 1987 Morris Chang pure play foundry",
    "TSMC",
  ],
  [
    "モントリオール議定書の採択",
    "Montreal Protocol September 16 1987 ozone CFC",
    "モントリオール議定書",
  ],
  [
    "",
    "fallback search words",
    "fallback search words",
  ],
];

for (const [
  title,
  fallback,
  expected,
] of cases) {
  assert.equal(
    buildWikipediaQuery(
      title,
      fallback
    ),
    expected,
    title || "(empty title)"
  );
}

console.log(
  `OK: Wikipedia検索語 ${cases.length}ケースを検査しました`
);
