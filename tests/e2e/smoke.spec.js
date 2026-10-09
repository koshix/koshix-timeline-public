import { test, expect } from "@playwright/test";
import {
  SETTINGS_STORAGE_FORMAT,
  SETTINGS_STORAGE_KEY,
  SETTINGS_STORAGE_VERSION,
} from "../../src/settings-store.js";
import { THREADS } from "../../src/threads.js";

const THEME_HEADING =
  `${THREADS.length}のテーマをたどる`;

const SETTINGS_KEY = SETTINGS_STORAGE_KEY;
const SETTINGS_FORMAT = SETTINGS_STORAGE_FORMAT;
const SETTINGS_VERSION = SETTINGS_STORAGE_VERSION;

async function openApp(page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "自分史プロジェクション",
      exact: true,
    })
  ).toBeVisible();
}

async function expectNoPageHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    viewport: globalThis.document.documentElement.clientWidth,
    document: Math.max(
      globalThis.document.documentElement.scrollWidth,
      globalThis.document.body.scrollWidth
    ),
  }));

  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
}

test("app loads and exposes the main controls", async ({ page }) => {
  await openApp(page);

  await expect(page.locator("#timeline-search")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "教育",
      exact: true,
    }).first()
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: THEME_HEADING,
      exact: true,
    })
  ).toBeVisible();

  const showAllCategories = page.getByRole("button", {
    name: "全て表示",
    exact: true,
  });
  const hideAllCategories = page.getByRole("button", {
    name: "全て隠す",
    exact: true,
  });

  await expect(showAllCategories)
    .toHaveAttribute("aria-pressed", "true");
  await expect(hideAllCategories)
    .toHaveAttribute("aria-pressed", "false");

  await hideAllCategories.click();

  await expect(showAllCategories)
    .toHaveAttribute("aria-pressed", "false");
  await expect(hideAllCategories)
    .toHaveAttribute("aria-pressed", "true");

  await showAllCategories.click();

  await expect(showAllCategories)
    .toHaveAttribute("aria-pressed", "true");
  await expect(hideAllCategories)
    .toHaveAttribute("aria-pressed", "false");
});

test("legal attribution and license links remain visible", async ({ page }) => {
  await openApp(page);

  await expect(
    page.getByText(/松尾公也氏の/)
  ).toBeVisible();

  await expect(
    page.getByRole("link", {
      name: "MIT License",
      exact: true,
    })
  ).toHaveAttribute("href", /LICENSE\.txt$/);

  await expect(
    page.getByRole("link", {
      name: "第三者ソフトウェア表示",
      exact: true,
    })
  ).toHaveAttribute(
    "href",
    /THIRD-PARTY-NOTICES\.md$/
  );
});

test("pre-release hides public distribution links", async ({ page }) => {
  await page.route("**/config.json", async (route) => {
    const response = await route.fetch();
    const config = await response.json();

    await route.fulfill({
      response,
      json: {
        ...config,
        publicDistributionEnabled: false,
      },
    });
  });

  await openApp(page);

  await expect(
    page.getByRole("link", {
      name: "ダウンロード版",
      exact: true,
    })
  ).toHaveCount(0);

  await expect(
    page.getByRole("link", {
      name: "公開用ソース",
      exact: true,
    })
  ).toHaveCount(0);
});

test("public release shows distribution links when enabled", async ({ page }) => {
  await page.route("**/config.json", async (route) => {
    const response = await route.fetch();
    const config = await response.json();

    await route.fulfill({
      response,
      json: {
        ...config,
        downloadUrl: "https://example.com/koshix-timeline-starter.zip",
        publicSourceUrl: "https://example.com/koshix-timeline-public",
        publicDistributionEnabled: true,
      },
    });
  });

  await openApp(page);

  await expect(
    page.getByRole("link", {
      name: "ダウンロード版",
      exact: true,
    })
  ).toBeVisible();

  await expect(
    page.getByRole("link", {
      name: "公開用ソース",
      exact: true,
    })
  ).toBeVisible();
});

test("historical birth year can be entered directly", async ({ page }) => {
  await openApp(page);

  const settings = page.locator("#timeline-settings");
  const toggle = settings.locator(":scope > button");

  if (
    (await toggle.getAttribute("aria-expanded"))
    !== "true"
  ) {
    await toggle.click();
  }

  const birthYear = page.getByLabel(
    "誕生年",
    { exact: true }
  );

  await birthYear.fill("1750");
  await birthYear.blur();

  await expect(
    birthYear
  ).toHaveValue("1750");

  await expect(
    toggle
  ).toContainText("1750年");
});

test("search can reduce the visible timeline to zero matches", async ({ page }) => {
  await openApp(page);

  const search = page.locator("#timeline-search");
  const eventRows = page.locator('li[id^="ev-"]');

  await page
    .getByRole("button", {
      name: "全期間枠を開く",
      exact: true,
    })
    .click();

  await expect(eventRows.first()).toBeVisible();
  expect(await eventRows.count()).toBeGreaterThan(0);

  await search.fill("__KOSHIX_E2E_NO_MATCH_7B31E9__");
  await expect(eventRows).toHaveCount(0);

  await search.fill("");
  await expect.poll(() => eventRows.count()).toBeGreaterThan(0);
});

test("versioned display settings survive reload", async ({ page }) => {
  await openApp(page);

  const educationButton = page
    .getByRole("button", {
      name: "教育",
      exact: true,
    })
    .first();

  await expect(educationButton).toHaveAttribute("aria-pressed", "true");
  await educationButton.click();
  await expect(educationButton).toHaveAttribute("aria-pressed", "false");

  await page.waitForFunction(
    ({ key, format, version }) => {
      const raw = globalThis.localStorage.getItem(key);
      if (!raw) return false;

      try {
        const record = JSON.parse(raw);
        return (
          record?.format === format &&
          record?.schemaVersion === version &&
          record?.data?.catOff?.education === true
        );
      } catch {
        return false;
      }
    },
    {
      key: SETTINGS_KEY,
      format: SETTINGS_FORMAT,
      version: SETTINGS_VERSION,
    }
  );

  const stored = await page.evaluate((key) => {
    const raw = globalThis.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, SETTINGS_KEY);

  expect(stored).toMatchObject({
    format: SETTINGS_FORMAT,
    schemaVersion: SETTINGS_VERSION,
  });
  expect(stored.data.catOff.education).toBe(true);

  await page.reload();

  await expect(
    page
      .getByRole("button", {
        name: "教育",
        exact: true,
      })
      .first()
  ).toHaveAttribute("aria-pressed", "false");
});

test("education history editing survives reload", async ({ page }) => {
  await openApp(page);

  const settings = page.locator("#timeline-settings");
  const toggle = settings.locator(":scope > button");

  if (
    (await toggle.getAttribute("aria-expanded"))
    !== "true"
  ) {
    await toggle.click();
  }

  const details = settings.locator("details");
  if (
    (await details.getAttribute("open")) === null
  ) {
    await details.locator("summary").click();
  }

  const start = page.getByLabel(
    "高校など（任意）1行目の入学年",
    { exact: true }
  );
  const years = page.getByLabel(
    "高校など（任意）1行目の修学年数",
    { exact: true }
  );
  const typeGroup = page.getByRole("group", {
    name: "高校などの種類",
    exact: true,
  });

  await start.fill("1980");
  await years.fill("5");
  await typeGroup
    .getByRole("button", {
      name: "高専",
      exact: true,
    })
    .click();

  await page.waitForFunction(
    ({ key, format, version }) => {
      const raw = globalThis.localStorage.getItem(key);
      if (!raw) return false;

      try {
        const record = JSON.parse(raw);
        const education = record?.data?.education;

        return (
          record?.format === format &&
          record?.schemaVersion === version &&
          Array.isArray(education) &&
          education.some(
            (row) =>
              row?.start === "1980" &&
              row?.years === "5" &&
              row?.type === "kosen"
          )
        );
      } catch {
        return false;
      }
    },
    {
      key: SETTINGS_KEY,
      format: SETTINGS_FORMAT,
      version: SETTINGS_VERSION,
    }
  );

  await page.reload();

  const reloadedSettings =
    page.locator("#timeline-settings");
  const reloadedToggle =
    reloadedSettings.locator(":scope > button");

  if (
    (await reloadedToggle.getAttribute(
      "aria-expanded"
    )) !== "true"
  ) {
    await reloadedToggle.click();
  }

  const reloadedDetails =
    reloadedSettings.locator("details");

  if (
    (await reloadedDetails.getAttribute("open")) === null
  ) {
    await reloadedDetails
      .locator("summary")
      .click();
  }

  await expect(
    page.getByLabel(
      "高校など（任意）1行目の入学年",
      { exact: true }
    )
  ).toHaveValue("1980");

  await expect(
    page.getByLabel(
      "高校など（任意）1行目の修学年数",
      { exact: true }
    )
  ).toHaveValue("5");

  await expect(
    page
      .getByRole("group", {
        name: "高校などの種類",
        exact: true,
      })
      .getByRole("button", {
        name: "高専",
        exact: true,
      })
  ).toHaveAttribute("aria-pressed", "true");
});

test("synthetic personal history survives reload and protected file operations", async ({ page }) => {
  const title = "E2E架空個人史";
  const summary = "E2Eテスト専用の架空個人史データです";

  await openApp(page);

  const section = page.locator("#personal-history");
  const sectionToggle = section.locator(":scope > button");

  if (
    (await sectionToggle.getAttribute("aria-expanded"))
    !== "true"
  ) {
    await sectionToggle.click();
  }

  await section
    .getByRole("button", { name: "▶ 編集する", exact: true })
    .click();
  await section
    .getByRole("button", { name: "＋追加", exact: true })
    .click();

  const form = section.locator("#personal-history-editor");
  await form.getByLabel("日付").fill("2002-03-04");
  await form.getByLabel("タイトル").fill(title);
  await form.getByLabel("概要").fill(summary);
  await form
    .getByRole("button", { name: "保存", exact: true })
    .click();

  await expect(section).toContainText("このブラウザ（1件）");

  // TSV保存→同じファイルを再読込。
  const downloadPromise = page.waitForEvent("download");
  await section
    .getByRole("button", { name: "ファイルに保存", exact: true })
    .click();

  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileInput = section.locator('input[type="file"]');
  await fileInput.setInputFiles(downloadPath);

  await expect(section).toContainText("このブラウザ（1件）");

  // 不正TSVは既存データを壊さない。
  await fileInput.setInputFiles({
    name: "invalid.tsv",
    mimeType: "text/tab-separated-values",
    buffer: Buffer.from("invalid\theader\n"),
  });

  await expect(section).toContainText("読み込み失敗");
  await expect(section).toContainText("このブラウザ（1件）");

  // 消去キャンセルでも既存データを保持。
  page.once("dialog", (dialog) => dialog.dismiss());

  await section
    .getByRole("button", { name: "自分史を消去", exact: true })
    .click();

  await expect(section).toContainText("このブラウザ（1件）");

  await page.reload();

  await expect(section).toContainText("このブラウザ（1件）");
  await section
    .getByRole("button", { name: "▶ 編集する", exact: true })
    .click();
  await expect(section.getByText(title, { exact: true })).toBeVisible();
});

test("synthetic timeline addition survives reload", async ({ page }) => {
  const title = "E2E架空共通年表項目";
  const summary = "E2Eテスト専用の架空共通年表データです";

  await openApp(page);

  const section = page.locator("#timeline-customization");
  await section
    .getByRole("button", { name: "▶ 編集する", exact: true })
    .click();
  await section
    .getByRole("button", { name: "＋追加", exact: true })
    .click();

  const form = section.locator("form").filter({
    hasText: "年表項目を追加",
  });
  await form.getByLabel("追加項目の日付").fill("2003-04-05");
  await form.getByLabel("追加項目のタイトル").fill(title);
  await form.getByLabel("追加項目の概要").fill(summary);
  await form
    .getByRole("button", { name: "追加して保存", exact: true })
    .click();

  await expect(section).toContainText("追加 1件");

  const search = page.locator("#timeline-search");
  const eventRows = page.locator('li[id^="ev-"]');
  await search.fill(title);
  await expect(eventRows).toHaveCount(1);
  await expect(page.getByText(title, { exact: true })).toBeVisible();

  await page.reload();

  await expect(section).toContainText("追加 1件");
  await search.fill(title);
  await expect(eventRows).toHaveCount(1);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
});

test("small and landscape viewports avoid overflow and expose keyboard focus", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 667, height: 375 },
  ]) {
    await page.setViewportSize(viewport);
    await openApp(page);
    await expectNoPageHorizontalOverflow(page);

    const search = page.locator("#timeline-search");
    await search.fill("AI");
    await expectNoPageHorizontalOverflow(page);
    await search.fill("");

    await page.goto("/?threads=1");

    await expect(
      page.getByRole("heading", {
        name: THEME_HEADING,
        exact: true,
      })
    ).toBeVisible();

    await expectNoPageHorizontalOverflow(page);
  }

  await page.setViewportSize({ width: 320, height: 568 });
  await openApp(page);

  const search = page.locator("#timeline-search");

  let reachedSearch = false;

  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");

    if (
      await search.evaluate(
        (element) =>
          globalThis.document.activeElement === element
      )
    ) {
      reachedSearch = true;
      break;
    }
  }

  expect(reachedSearch).toBe(true);

  const outlineStyle = await search.evaluate(
    (element) =>
      globalThis.getComputedStyle(element).outlineStyle
  );

  expect(outlineStyle).not.toBe("none");

  await page.keyboard.type("AI");
  await expect(search).toHaveValue("AI");
  await search.fill("");

  const settings = page.locator("#timeline-settings");
  const settingsToggle = settings.locator(":scope > button");

  if (
    (await settingsToggle.getAttribute("aria-expanded"))
    !== "true"
  ) {
    await settingsToggle.click();
  }

  await settings.locator("summary").click();
  await expectNoPageHorizontalOverflow(page);

  const personal = page.locator("#personal-history");
  const personalToggle = personal.locator(":scope > button");

  if (
    (await personalToggle.getAttribute("aria-expanded"))
    !== "true"
  ) {
    await personalToggle.click();
  }

  await personal
    .getByRole("button", {
      name: "▶ 編集する",
      exact: true,
    })
    .click();

  await expectNoPageHorizontalOverflow(page);

  await page
    .getByRole("button", {
      name: "▶ 絞込み",
      exact: true,
    })
    .click();

  await expectNoPageHorizontalOverflow(page);

  const periodToggle = page.getByRole("button", {
    name: /全期間枠を(開く|閉じる)/,
  });

  if (
    (await periodToggle.getAttribute("aria-label"))
    === "全期間枠を開く"
  ) {
    await periodToggle.click();
  }

  await search.fill("Macintosh");

  const eventButton =
    page.locator('li[id^="ev-"] > button').first();

  await expect(eventButton).toBeVisible();
  await eventButton.click();

  await expect(
    page.getByRole("link", {
      name: "Wikipediaで探す",
    }).first()
  ).toBeVisible();

  await expectNoPageHorizontalOverflow(page);
});
