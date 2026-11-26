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
    const total = await page.locator("#s1-place .count").getAttribute("data-total");
    await page.fill("#q", "station");
    const shown = page.locator('#s1-place [data-text]:not([hidden])');
    await expect(shown.first()).toContainText("駅");
    const n = await shown.count();
    expect(n).toBeGreaterThan(0);
    await expect(page.locator("#s1-place .count")).toHaveText(`${n} / ${total}개`);
    // 검색 중에는 맞지 않는 항목이 숨겨진다
    expect(n).toBeLessThan(Number(total));
    await expect(page.locator("#s1-kana")).toBeHidden();
    await shot(page, testInfo, "02-search");

    await page.fill("#q", "zzzz없는말");
    await expect(page.locator('.stage:not([hidden]) .empty-state')).toBeVisible();
    await expect(page.locator('.stage:not([hidden]) .empty-state strong')).toContainText("zzzz없는말");

    await page.fill("#q", "");
    await expect(page.locator("#s1-kana")).toBeVisible();
    await expect(page.locator("#s1-place .count")).toHaveText(`${total}개`);
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
    // 패널(위)과 탭바(아래)에 가리지 않는 위치로 칸을 옮긴 뒤 누른다
    const cell = page.locator("#s1-greet .cell.ko").nth(3);
    await cell.evaluate(el => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - (window.innerHeight - 200));
    });
    await press(page, cell);
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
  test("중국어 칸은 병음과 성조 발음을 보여 주고 zh-CN으로 읽는다", async ({ page }) => {
    await scrollToSection(page, "s1-greet");
    const zh = page.locator("#s1-greet .cell.zh").first();
    await expect(zh.locator(".py")).toBeVisible();
    await expect(zh.locator(".pron .tone").first()).toBeVisible();
    await press(page, zh.locator(".say"));
    const spoken = await page.evaluate(() => window.__spoken);
    expect(spoken.at(-1).lang).toBe("zh-CN");
    expect(spoken.at(-1).text).toBe(await zh.locator(".txt").innerText());
  });

  test("공부할 언어를 끄면 그 열이 사라지고, 새로고침해도 유지된다", async ({ page }) => {
    await press(page, page.locator(".view summary"));
    await press(page, page.locator('label[for="show-zh"]'));
    await page.keyboard.press("Escape");
    await expect(page.locator("#s1-greet .cell.zh").first()).toBeHidden();
    await expect(page.locator("#s1-pinyin")).toBeHidden();
    await expect(page.locator("#s1-greet .cell.ja").first()).toBeVisible();
    await page.reload();
    await expect(page.locator("#show-zh")).not.toBeChecked();
    await expect(page.locator("#s1-greet .cell.zh").first()).toBeHidden();
    for(const i of [0, 1, 2]){
      await press(page, stageNav(page).nth(i));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });

  test("병음은 성조 기호 없이도, 한글 발음은 표기 기호 없이도 검색된다", async ({ page }) => {
    await page.fill("#q", "xie xie");
    await expect(page.locator(".stage:not([hidden]) [data-text]:not([hidden])").first()).toContainText("谢谢");
    await page.fill("#q", "오하요");
    await expect(page.locator("#s1-greet [data-text]:not([hidden])").first()).toContainText("おはよう");
    await expect(page.locator("#s1-pinyin")).toBeHidden();
  });
  test("주소의 #stage-3으로 열면 3단계가 보인다", async ({ page }) => {
    // 같은 문서에서 hash만 바꾸면 다시 로드되지 않으므로 새로 연다
    await page.goto("about:blank");
    await page.goto(PAGE_URL + "#stage-3");
    expect(await visibleStages(page)).toEqual(["3"]);
  });

  test("병음표를 누르면 예시 한자를 중국어로 읽는다", async ({ page }) => {
    await scrollToSection(page, "s1-pinyin");
    await press(page, page.locator("#s1-pinyin .tone-grid .k").first());
    await press(page, page.locator("#s1-pinyin .py-grid .k").first());
    const spoken = await page.evaluate(() => window.__spoken);
    expect(spoken).toEqual([{ text: "妈", lang: "zh-CN" }, { text: "八", lang: "zh-CN" }]);
  });

  test("중국어 한자와 중국어 한글 발음으로도 검색된다", async ({ page }) => {
    await page.fill("#q", "你好");
    await expect(page.locator("#s1-greet [data-text]:not([hidden])").first()).toContainText("你好");
    await page.fill("#q", "니 하오");
    await expect(page.locator("#s1-greet [data-text]:not([hidden])").first()).toContainText("你好");
  });

  test("다른 단계에서 검색하면 그 단계 안에서만 찾고, 지우면 개수가 돌아온다", async ({ page }) => {
    await press(page, stageNav(page).nth(1));
    await page.fill("#q", "americano");
    const shown = page.locator(".stage:not([hidden]) [data-text]:not([hidden])");
    expect(await shown.count()).toBeGreaterThan(0);
    await expect(page.locator("#stage-1")).toBeHidden();
    await page.fill("#q", "");
    await expect(page.locator("#s2-cafe .count")).toHaveText(/^\d+개$/);
  });

  test("공부할 언어를 모두 다시 켜면 저장값도 모두 켜짐으로 바뀐다", async ({ page }) => {
    await press(page, page.locator(".view summary"));
    await press(page, page.locator('label[for="show-en"]'));
    await press(page, page.locator('label[for="show-en"]'));
    expect(await page.evaluate(() => localStorage.getItem("tri.langs"))).toBe("ja,zh,en");
  });
});
