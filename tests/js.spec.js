import { test, expect } from "@playwright/test";
import { PAGE_URL, press, filterOf, shot, scrollToSection } from "./helpers.js";

/* Safari, Chrome 조건 (JS 켜짐, 오프라인) */
test.describe("JS로 열었을 때", () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, "JS 켬 프로젝트 전용");

  test.beforeEach(async ({ page }) => {
    // 발음 호출을 기록하는 가짜 speechSynthesis
    await page.addInitScript(() => {
      window.__spoken = [];
      class FakeUtterance { constructor(text){ this.text = text; } }
      window.SpeechSynthesisUtterance = FakeUtterance;
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: { cancel(){}, speak(u){ window.__spoken.push({ text: u.text, lang: u.lang }); } },
      });
    });
    await page.goto(PAGE_URL);
  });

  const visibleStages = page => page.$$eval(".stage", els => els.filter(e => !e.hidden).map(e => e.dataset.stage));
  const stageNav = page => page.viewportSize().width < 720 ? page.locator(".tabbar a") : page.locator(".stage-seg a");

  test("처음에는 1단계만 보이고, 탭으로 단계를 바꾼다", async ({ page }, testInfo) => {
    await expect(page.locator("html")).not.toHaveClass(/no-js/);
    expect(await visibleStages(page)).toEqual(["1"]);
    await shot(page, testInfo, "01-top");

    await press(page, stageNav(page).nth(1));
    expect(await visibleStages(page)).toEqual(["2"]);
    await expect(stageNav(page).nth(1)).toHaveAttribute("aria-current", "page");
    await expect(stageNav(page).nth(0)).not.toHaveAttribute("aria-current", "page");
    // 목차도 2단계 것만 보인다
    await expect(page.locator('.toc-group[data-stage="2"]')).not.toHaveAttribute("hidden", "");
    await expect(page.locator('.toc-group[data-stage="1"]')).toHaveAttribute("hidden", "");
  });

  test("마지막으로 본 단계를 기억한다", async ({ page }) => {
    await press(page, stageNav(page).nth(2));
    await page.reload();
    expect(await visibleStages(page)).toEqual(["3"]);
  });

  test("검색하면 맞는 항목만 남고, 없으면 안내가 나온다", async ({ page }, testInfo) => {
    await page.fill("#q", "station");
    const shown = page.locator('.stage:not([hidden]) [data-text]:not([hidden])');
    await expect(shown).toHaveCount(1);
    await expect(shown.first()).toContainText("駅");
    await expect(page.locator("#s1-place .count")).toHaveText("1 / 16개");
    await expect(page.locator("#s1-kana")).toBeHidden();
    await shot(page, testInfo, "02-search");

    await page.fill("#q", "zzzz없는말");
    await expect(page.locator('.stage:not([hidden]) .empty-state')).toBeVisible();
    await expect(page.locator('.stage:not([hidden]) .empty-state strong')).toContainText("zzzz없는말");

    await page.fill("#q", "");
    await expect(page.locator("#s1-kana")).toBeVisible();
    await expect(page.locator("#s1-place .count")).toHaveText("16개");
  });

  test("가리기: 칸을 누를 때마다 보였다 가려진다", async ({ page }) => {
    await press(page, page.locator(".view summary"));
    await press(page, page.locator('label[for="hide-ja"]'));
    await expect(page.locator(".icon-btn .dot")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".view-panel")).toBeHidden();

    await scrollToSection(page, "s1-greet");
    const cell = page.locator("#s1-greet .cell.ja").first();
    const txt = cell.locator(".txt");
    await expect.poll(() => filterOf(txt)).toBe("blur(7px)");
    await press(page, cell);
    await expect.poll(() => filterOf(txt)).toBe("none");
    await press(page, cell);
    await expect.poll(() => filterOf(txt)).toBe("blur(7px)");
  });

  test("보기 설정 패널은 바깥을 누르면 닫힌다", async ({ page }) => {
    await press(page, page.locator(".view summary"));
    await expect(page.locator(".view-panel")).toBeVisible();
    await scrollToSection(page, "s1-greet");
    await press(page, page.locator("#s1-greet .cell.ko").nth(3));
    await expect(page.locator(".view-panel")).toBeHidden();
  });

  test("발음 버튼은 언어에 맞게 읽는다", async ({ page }) => {
    await scrollToSection(page, "s1-greet");
    await press(page, page.locator("#s1-greet .cell.ja .say").first());
    await press(page, page.locator("#s1-greet .cell.en .say").first());
    await scrollToSection(page, "s1-kana");
    await press(page, page.locator(".kana-set.hira .k").first());
    const spoken = await page.evaluate(() => window.__spoken);
    expect(spoken).toEqual([
      { text: "おはようございます", lang: "ja-JP" },
      { text: "Good morning.", lang: "en-US" },
      { text: "あ", lang: "ja-JP" },
    ]);
  });

  test("발음 버튼을 눌러도 가린 칸이 열리지 않는다", async ({ page }) => {
    await press(page, page.locator(".view summary"));
    await press(page, page.locator('label[for="hide-ja"]'));
    await page.keyboard.press("Escape");
    await scrollToSection(page, "s1-greet");
    await press(page, page.locator("#s1-greet .cell.ja .say").first());
    await expect(page.locator("#s1-greet .cell.ja").first()).not.toHaveClass(/shown/);
  });

  test("스크롤하면 목차에 현재 주제가 표시된다", async ({ page }) => {
    await scrollToSection(page, "s1-food");
    await expect(page.locator('.toc a[data-for="s1-food"]')).toHaveClass(/on/);
  });

  test("가로 스크롤이 생기지 않는다", async ({ page }) => {
    for(const i of [0, 1, 2]){
      await press(page, stageNav(page).nth(i));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${i + 1}단계`).toBeLessThanOrEqual(0);
    }
  });

  test("화면 기록: 라이트, 다크 모드", async ({ page }, testInfo) => {
    await press(page, stageNav(page).nth(1));
    await scrollToSection(page, "s2-cafe");
    await page.emulateMedia({ colorScheme: "light" });
    await shot(page, testInfo, "03-dialog-light");
    await page.emulateMedia({ colorScheme: "dark" });
    await shot(page, testInfo, "04-dialog-dark");
  });
});
