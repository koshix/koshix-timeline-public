import { test, expect } from "@playwright/test";
import { THREADS } from "../../src/threads.js";
import {
  THREAD_QUERIES_STORAGE_FORMAT,
  THREAD_QUERIES_STORAGE_VERSION,
} from "../../src/thread-queries-store.js";

const THEME_HEADING =
  `${THREADS.length}のテーマをたどる`;

test("dynamic thread can be generated and shared", async ({ page }) => {
  await page.goto("/?threads=1");

  await expect(
    page.getByRole("heading", {
      name: THEME_HEADING,
      exact: true,
    })
  ).toBeVisible();

  await expect(
    page.getByText("個人史は検索対象にしません", {
      exact: false,
    })
  ).toBeVisible();

  const query = page.getByRole("searchbox", {
    name: "たどるキーワード",
  });

  await query.fill("1947 || 1948");
  await page
    .getByRole("button", {
      name: "たどる",
      exact: true,
    })
    .click();

  const generatedThread = page.getByRole("button", {
    name: /1947 \|\| 1948をたどる.*項目/,
  });

  await expect(generatedThread).toBeVisible();
  await expect(generatedThread).toContainText("項目");

  await generatedThread.click();

  const dialog = page.getByRole("dialog", {
    name: /テーマ閲覧:1947 \|\| 1948をたどる/,
  });
  await expect(dialog).toBeVisible();

  const previous = dialog.getByRole("button", {
    name: "前へ",
  });
  const next = dialog.getByRole("button", {
    name: "次へ",
  });

  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await expect(dialog.getByRole("button", { name: /再生|一時停止/ })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: /倍速/ })).toHaveCount(0);
  await expect(dialog.getByText(/^1 \/ \d+$/)).toBeVisible();

  await next.click();

  await expect(previous).toBeEnabled();
  await expect(dialog.getByText(/^2 \/ \d+$/)).toBeVisible();

  await expect(
    dialog.getByRole("link", { name: "Xで共有" })
  ).toBeVisible();

  const bluesky = dialog.getByRole("link", {
    name: "Blueskyで共有",
  });
  await expect(bluesky).toBeVisible();
  await expect(bluesky).toHaveAttribute(
    "href",
    /bsky\.app\/intent\/compose/
  );
  await expect(bluesky).toHaveAttribute(
    "href",
    /threads%3D1/
  );
  await expect(bluesky).toHaveAttribute(
    "href",
    /play%3D1/
  );
});

test("a single dynamic match remains visible", async ({ page }) => {
  await page.goto("/?threads=1");

  const query = page.getByRole("searchbox", {
    name: "たどるキーワード",
  });

  await query.fill("2006 twitter");
  await page
    .getByRole("button", {
      name: "たどる",
      exact: true,
    })
    .click();

  await expect(
    page.getByText("1件だけ見つかりました", {
      exact: false,
    })
  ).toBeVisible();
});


test("unreadable saved thread queries are not overwritten", async ({ page }) => {
  const dbName =
    "koshix-timeline-thread-queries";
  const storeName = "thread-queries";
  const key = "queries";
  const futureVersion =
    THREAD_QUERIES_STORAGE_VERSION + 1;

  await page.goto("/?threads=1");

  await page.evaluate(
    async ({
      dbName,
      storeName,
      key,
      format,
      futureVersion,
    }) => {
      const db = await new Promise(
        (resolve, reject) => {
          const request =
            globalThis.indexedDB.open(dbName, 1);

          request.onupgradeneeded = () => {
            if (
              !request.result.objectStoreNames
                .contains(storeName)
            ) {
              request.result
                .createObjectStore(storeName);
            }
          };

          request.onsuccess = () =>
            resolve(request.result);
          request.onerror = () =>
            reject(request.error);
        }
      );

      await new Promise(
        (resolve, reject) => {
          const tx = db.transaction(
            storeName,
            "readwrite"
          );

          tx.objectStore(storeName).put(
            {
              format,
              schemaVersion:
                futureVersion,
              data: ["将来版の保存データ"],
            },
            key
          );

          tx.oncomplete = resolve;
          tx.onerror = () =>
            reject(tx.error);
          tx.onabort = () =>
            reject(tx.error);
        }
      );

      db.close();
    },
    {
      dbName,
      storeName,
      key,
      format:
        THREAD_QUERIES_STORAGE_FORMAT,
      futureVersion,
    }
  );

  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: THEME_HEADING,
      exact: true,
    })
  ).toBeVisible();

  await page.waitForTimeout(300);

  const stored = await page.evaluate(
    async ({
      dbName,
      storeName,
      key,
    }) => {
      const db = await new Promise(
        (resolve, reject) => {
          const request =
            globalThis.indexedDB.open(dbName, 1);

          request.onsuccess = () =>
            resolve(request.result);
          request.onerror = () =>
            reject(request.error);
        }
      );

      const value = await new Promise(
        (resolve, reject) => {
          const tx = db.transaction(
            storeName,
            "readonly"
          );
          const request =
            tx.objectStore(storeName).get(
              key
            );

          request.onsuccess = () =>
            resolve(request.result);
          request.onerror = () =>
            reject(request.error);
        }
      );

      db.close();
      return value;
    },
    {
      dbName,
      storeName,
      key,
    }
  );

  expect(stored).toEqual({
    format:
      THREAD_QUERIES_STORAGE_FORMAT,
    schemaVersion: futureVersion,
    data: ["将来版の保存データ"],
  });
});
