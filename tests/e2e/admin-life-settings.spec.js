import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const PERSONAL_EVENTS_TSV = [
  "id\tdate\tend_date\ttitle\tcats\tprimary\tsubs\tregion\timportance\tsummary\tsources\tsearch\tnote",
  [
    "admin-e2e-1",
    "2001-02-03",
    "",
    "E2E管理者個人史",
    "me",
    "me",
    "",
    "",
    "2",
    "管理者データから取り込む架空の個人史です",
    "",
    "",
    "",
  ].join("\t"),
  "",
].join("\n");

const BROWSER_PERSONAL_EVENTS_TSV =
  PERSONAL_EVENTS_TSV
    .replace("admin-e2e-1", "browser-e2e-1")
    .replace("E2E管理者個人史", "E2E既存ブラウザ個人史");

const LIFE_SETTINGS_TSV = [
  "section\tstart\tend\tyears\ttype\tlabel\tvalue",
  "profile\t\t\t\t\tformat\tkoshix-timeline-life-settings",
  "profile\t\t\t\t\tversion\t3",
  "profile\t\t\t\t\tbirth_year\t1988",
  "profile\t\t\t\t\tbirth_month\t4",
  "education\t1993\t\t2\tkindergarten\t幼稚園\t",
  "education\t2007\t\t4\tuniversity\t大学\t",
  "education\t2011\t\t2\tmasters\t大学院（修士）\t",
  "education\t2013\t\t3\tdoctorate\t大学院（博士）\t",
  "adult\t2016\t\t\t\tE2E架空成人期\t",
  "",
].join("\n");

test("administrator life settings update the editor and exported TSV", async ({
  page,
  context,
}) => {
  await context.route(
    "**/personal/auth.html",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: `<!doctype html>
<script>
window.opener?.postMessage(
  { type: "koshix-admin-authenticated" },
  window.location.origin
);
window.close();
</script>`,
      })
  );

  await page.route(
    "**/personal/personal-events.tsv",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/tab-separated-values",
        body: PERSONAL_EVENTS_TSV,
      })
  );

  await page.route(
    "**/personal/koshix-timeline-life-settings.tsv",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/tab-separated-values",
        body: LIFE_SETTINGS_TSV,
      })
  );

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "自分史プロジェクション",
      exact: true,
    })
  ).toBeVisible();

  const personal = page.locator("#personal-history");
  const personalToggle = personal.locator(":scope > button");

  if (
    (await personalToggle.getAttribute("aria-expanded"))
    !== "true"
  ) {
    await personalToggle.click();
  }

  // 管理者データ読込前のブラウザ個人史を1件保存。
  await personal
    .locator('input[type="file"]')
    .setInputFiles({
      name: "browser-personal-history.tsv",
      mimeType: "text/tab-separated-values",
      buffer: Buffer.from(BROWSER_PERSONAL_EVENTS_TSV),
    });

  await expect(personal).toContainText(
    "このブラウザ（1件）"
  );

  await page
    .locator("summary")
    .filter({ hasText: "管理者向け" })
    .click();

  await expect(
    page.getByRole("link", {
      name: "管理者認証",
      exact: true,
    })
  ).toHaveCount(0);

  await page
    .getByRole("button", {
      name: "管理者データ読込",
      exact: true,
    })
    .click();

  const editorToggle = personal.getByRole(
    "button",
    {
      name: "▶ 編集する",
      exact: true,
    }
  );

  await expect(personal).toContainText(
    "管理者データ（1件）"
  );
  await expect(editorToggle).toBeDisabled();

  // 管理者データは専用IndexedDBへ保存され、
  // 再読み込み後も通常のブラウザ個人史より優先して復元される。
  await page.reload();

  if (
    (await personalToggle.getAttribute("aria-expanded"))
    !== "true"
  ) {
    await personalToggle.click();
  }

  await expect(personal).toContainText(
    "管理者データ（1件）"
  );
  await expect(personal).toContainText(
    "管理者データ 1件をブラウザ保存から読み込みました"
  );

  const settingsAfterReload =
    page.locator("#timeline-settings");

  await expect(settingsAfterReload).toContainText(
    "1988年4月生まれ"
  );

  await page
    .locator("summary")
    .filter({ hasText: "管理者向け" })
    .click();

  await expect(page.getByText(
    "管理者データ：ブラウザ保存済み",
    { exact: true }
  )).toBeVisible();

  page.once("dialog", (dialog) => {
    dialog.accept();
  });

  const reloadAfterClear =
    page.waitForEvent("framenavigated");

  await page
    .getByRole("button", {
      name: "管理者データをブラウザから消去",
      exact: true,
    })
    .click();

  await reloadAfterClear;

  if (
    (await personalToggle.getAttribute("aria-expanded"))
    !== "true"
  ) {
    await personalToggle.click();
  }

  await expect(personal).toContainText(
    "このブラウザ（1件）"
  );

  await personal
    .getByRole("button", {
      name: "▶ 編集する",
      exact: true,
    })
    .click();

  await expect(
    personal.getByText(
      "E2E既存ブラウザ個人史",
      { exact: true }
    )
  ).toBeVisible();

  // 管理者データを再読込し、従来の編集用取込も確認する。
  await page
    .locator("summary")
    .filter({ hasText: "管理者向け" })
    .click();

  await page
    .getByRole("button", {
      name: "管理者データ読込",
      exact: true,
    })
    .click();

  page.once("dialog", (dialog) => {
    dialog.accept();
  });

  await personal
    .getByRole("button", {
      name: "編集用に取り込む",
      exact: true,
    })
    .click();

  await expect(personal).toContainText(
    "このブラウザ（1件）"
  );
  const openEditorToggle = personal
    .getByRole(
      "button",
      {
        name: "▼ 編集する",
        exact: true,
      }
    )
    .first();

  await expect(openEditorToggle).toBeEnabled();

  await expect(
    personal.getByText(
      "E2E管理者個人史",
      { exact: true }
    )
  ).toBeVisible();

  const settings = page.locator("#timeline-settings");

  await expect(settings).toContainText(
    "1988年4月生まれ"
  );

  const settingsToggle =
    settings.locator(":scope > button");

  if (
    (await settingsToggle.getAttribute(
      "aria-expanded"
    )) !== "true"
  ) {
    await settingsToggle.click();
  }

  await expect(
    settingsToggle
  ).toHaveAttribute(
    "aria-expanded",
    "true"
  );

  await settings
    .locator("summary")
    .filter({ hasText: "詳しく設定する" })
    .click();

  await expect(
    page.getByLabel(
      "幼稚園・保育所（任意）1行目の入った年"
    )
  ).toHaveValue("1993");

  await expect(
    page.getByLabel(
      "幼稚園・保育所（任意）1行目の在年数"
    )
  ).toHaveValue("2");

  await expect(
    page.getByLabel(
      "大学など（任意）1行目の入学年"
    )
  ).toHaveValue("2007");

  await expect(
    page.getByLabel(
      "大学など（任意）1行目の修学年数"
    )
  ).toHaveValue("4");

  await expect(
    page.getByLabel(
      "大学院（任意）1行目の入学年"
    )
  ).toHaveValue("2011");

  await expect(
    page.getByLabel(
      "大学院（任意）2行目の入学年"
    )
  ).toHaveValue("2013");

  await expect(
    page.getByLabel(
      "1番目の成人期区分の名称"
    )
  ).toHaveValue("E2E架空成人期");

  const downloadPromise =
    page.waitForEvent("download");

  await settings
    .getByRole("button", {
      name: "ファイルに保存",
      exact: true,
    })
    .click();

  const download = await downloadPromise;
  const downloadPath = await download.path();

  expect(downloadPath).not.toBeNull();

  const exported = (
    await readFile(downloadPath, "utf8")
  ).replace(/^\uFEFF/, "");

  expect(exported).toContain(
    "profile\t\t\t\t\tbirth_year\t1988"
  );
  expect(exported).toContain(
    "education\t2007\t\t4\tuniversity"
  );
  expect(exported).toContain(
    "education\t2013\t\t3\tdoctorate"
  );
  expect(exported).toContain(
    "adult\t2016\t\t\t\tE2E架空成人期\t"
  );
});
