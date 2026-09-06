import { test, expect } from "@playwright/test";

test("dynamic thread can be generated and shared", async ({ page }) => {
  await page.goto("/?threads=1");

  await expect(
    page.getByRole("heading", {
      name: "テーマの糸",
      exact: true,
    })
  ).toBeVisible();

  await expect(
    page.getByText("個人史は検索対象にしません", {
      exact: false,
    })
  ).toBeVisible();

  const query = page.getByRole("searchbox", {
    name: "動的テーマのキーワード",
  });

  await query.fill("1947 || 1948");
  await page
    .getByRole("button", {
      name: "糸を作る",
      exact: true,
    })
    .click();

  const generatedThread = page.getByRole("button", {
    name: /「1947 \|\| 1948」の糸/,
  });

  await expect(generatedThread).toBeVisible();
  await expect(generatedThread).toContainText("項目");

  await generatedThread.click();

  const dialog = page.getByRole("dialog", {
    name: /テーマ閲覧:「1947 \|\| 1948」の糸/,
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
    name: "動的テーマのキーワード",
  });

  await query.fill("2006 twitter");
  await page
    .getByRole("button", {
      name: "糸を作る",
      exact: true,
    })
    .click();

  await expect(
    page.getByText("1件だけ見つかりました", {
      exact: false,
    })
  ).toBeVisible();
});
