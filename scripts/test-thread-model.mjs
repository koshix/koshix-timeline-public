import assert from "node:assert/strict";
import {
  buildConfiguredThreads,
  buildDynamicThread,
  findThreadByKey,
} from "../src/thread-model.js";

const events = [
  {
    id: "a",
    date: "1947",
    title: "トランジスタの発明",
    summary: "半導体技術の転換点。",
    search: "半導体 transistor",
    importance: 3,
  },
  {
    id: "b",
    date: "1971",
    title: "マイクロプロセッサ",
    summary: "集積回路と半導体によるCPU。",
    search: "半導体 computer",
    importance: 3,
  },
  {
    id: "c",
    date: "1985",
    title: "教育用コンピュータ",
    summary: "学校でのコンピュータ利用。",
    search: "教育 computer",
    importance: 2,
  },
  {
    id: "d",
    date: "2022",
    title: "対話型生成AI",
    summary: "人工知能が一般利用者へ広がる。",
    search: "AI 人工知能 computer",
    importance: 3,
  },
];

{
  const configured = buildConfiguredThreads(
    [
      {
        key: "sample",
        title: "sample",
        lead: "sample",
        items: [{ id: "a" }, { id: "b" }, { id: "missing" }],
      },
      {
        key: "too-short",
        title: "short",
        lead: "short",
        items: [{ id: "a" }],
      },
    ],
    events
  );

  assert.equal(configured.length, 1);
  assert.deepEqual(
    configured[0].events.map((event) => event.id),
    ["a", "b"]
  );
  assert.equal(
    findThreadByKey(configured, "sample")?.key,
    "sample"
  );
  assert.equal(
    findThreadByKey(configured, "missing"),
    null
  );
}

{
  const result = buildDynamicThread({
    query: "半導体",
    events,
  });

  assert.equal(result.error, null);
  assert.equal(result.totalMatches, 2);
  assert.equal(result.selectedCount, 2);
  assert.deepEqual(
    result.thread.events.map((event) => event.id),
    ["a", "b"]
  );
  assert.deepEqual(
    result.matches.map((event) => event.id),
    ["a", "b"]
  );
}

{
  const result = buildDynamicThread({
    query: "computer 教育",
    events,
  });

  assert.equal(result.totalMatches, 1);
  assert.equal(result.thread, null);
  assert.equal(result.selectedCount, 1);
  assert.deepEqual(
    result.matches.map((event) => event.id),
    ["c"]
  );
}

{
  const result = buildDynamicThread({
    query: "半導体 || 人工知能",
    events,
    maxItems: 2,
  });

  assert.equal(result.totalMatches, 3);
  assert.equal(result.selectedCount, 2);
  assert.ok(result.thread);
}

{
  const result = buildDynamicThread({
    query: "(半導体",
    events,
  });

  assert.equal(result.thread, null);
  assert.equal(result.error, "検索式を確認してください");
  assert.deepEqual(result.matches, []);
}

console.log("thread model tests passed");
