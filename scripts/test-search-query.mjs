import assert from "node:assert/strict";
import {
  matchesSearchExpression,
  normalizeSearchText,
  parseSearchExpression,
  tokenizeSearchQuery,
} from "../src/search-query.js";

assert.equal(
  normalizeSearchText("ＡＩ ChatGPT"),
  "ai chatgpt"
);

assert.deepEqual(
  tokenizeSearchQuery("AI ChatGPT"),
  ["ai", "&&", "chatgpt"]
);

assert.deepEqual(
  tokenizeSearchQuery("AI、教育"),
  ["ai", "&&", "教育"]
);

assert.deepEqual(
  tokenizeSearchQuery("AI (教育 || science)"),
  ["ai", "&&", "(", "教育", "||", "science", ")"]
);

{
  const parsed = parseSearchExpression("a || b && c");

  assert.equal(parsed.error, null);
  assert.equal(
    matchesSearchExpression(parsed.root, "a"),
    true
  );
  assert.equal(
    matchesSearchExpression(parsed.root, "b c"),
    true
  );
  assert.equal(
    matchesSearchExpression(parsed.root, "b"),
    false
  );
}

{
  const parsed = parseSearchExpression("a && (b || c)");

  assert.equal(parsed.error, null);
  assert.equal(
    matchesSearchExpression(parsed.root, "a b"),
    true
  );
  assert.equal(
    matchesSearchExpression(parsed.root, "a c"),
    true
  );
  assert.equal(
    matchesSearchExpression(parsed.root, "a"),
    false
  );
}

{
  const parsed = parseSearchExpression("");

  assert.equal(parsed.root, null);
  assert.equal(parsed.error, null);
}

{
  const parsed = parseSearchExpression("a &&");

  assert.equal(parsed.root, null);
  assert.equal(
    parsed.error,
    "検索式を確認してください"
  );
}

console.log(
  "OK: 年表内検索の正規化・論理式解析・AND/OR評価を検査しました"
);
