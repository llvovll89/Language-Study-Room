import { expect, test } from "@playwright/test";
import { fakeSpeech, filterOf, hydrated, isMobile, openSettings, overflowX, press, scrollToSection, spoken } from "./helpers";

/* JS 켠 환경: 기존 HTML 버전(tests/js.spec.js)과 같은 동작을 확인 */
test.describe("웹앱 동작", () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, "JS 켬 전용");
  test.beforeEach(async ({ page }) => { await fakeSpeech(page); });

  const stageNav = (page: import("@playwright/test").Page) =>
    isMobile(page) ? page.locator(".tabbar a") : page.locator(".stage-seg a");

  test("홈에서 기본 단계로 들어가고, 탭으로 단계를 바꾼다", async ({ page }) => {
    await page.goto("/"); await hydrated(page);
    await expect(page.locator(".stage-card")).toHaveCount(4);
    await press(page, page.locator(".cta"));
    await expect(page).toHaveURL(/\/basic$/);
    await expect(page.locator("h1")).toContainText("기본");
    await press(page, stageNav(page).nth(1));
    await expect(page).toHaveURL(/\/intermediate$/);
    await expect(stageNav(page).nth(1)).toHaveAttribute("aria-current", "page");
    await expect(page.locator('.toc a[data-for="s2-cafe"]')).toHaveCount(1);
  });

  test("마지막으로 본 단계를 홈에서 이어서 볼 수 있다", async ({ page }) => {
    await page.goto("/advanced"); await hydrated(page);
    await page.goto("/"); await hydrated(page);
    await expect(page.locator(".cta")).toContainText("이어서 보기 · 심화");
    await expect(page.locator(".cta")).toHaveAttribute("href", "/advanced");
  });

  test("없는 주소는 404 화면을 보여 준다", async ({ page }) => {
    const res = await page.goto("/nope");
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText("페이지를 찾을 수 없습니다");
  });

  test("검색하면 맞는 항목만 남고, 없으면 안내가 나오고, 지우면 돌아온다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    const count = page.locator("#s1-place .count");
    const total = (await count.innerText()).replace("개", "");
    await page.fill("#q", "station");
    const shown = page.locator("#s1-place [data-item]");
    await expect(shown.first()).toContainText("駅");
    const n = await shown.count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(Number(total));
    await expect(count).toHaveText(`${n} / ${total}개`);
    await expect(page.locator("#s1-kana")).toHaveCount(0);

    await page.fill("#q", "zzzz없는말");
    await expect(page.locator(".empty-state")).toContainText("zzzz없는말");

    await page.fill("#q", "");
    await expect(page.locator("#s1-kana")).toBeVisible();
    await expect(count).toHaveText(`${total}개`);
  });

  test("병음은 성조 기호 없이, 한글 발음은 표기 기호 없이도 검색된다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    await page.fill("#q", "xie xie");
    await expect(page.locator("[data-item]").first()).toContainText("谢谢");
    await page.fill("#q", "오하요");
    await expect(page.locator("#s1-greet [data-item]").first()).toContainText("おはよう");
    await page.fill("#q", "니 하오");
    await expect(page.locator("#s1-greet [data-item]").first()).toContainText("你好");
  });

  test("단계를 바꾸면 검색어가 비워진다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    await page.fill("#q", "station");
    await press(page, stageNav(page).nth(1));
    await expect(page.locator("#q")).toHaveValue("");
  });

  test("가리기: 칸을 누를 때마다 보였다 가려진다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#hide-ja"));
    await expect(page.locator(".view .dot")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#view-panel")).toHaveCount(0);

    await scrollToSection(page, "s1-greet");
    const cell = page.locator("#s1-greet .cell.ja").first();
    const txt = cell.locator(".txt");
    await expect.poll(() => filterOf(txt)).toBe("blur(7px)");
    await press(page, cell.locator(".txt"));
    await expect.poll(() => filterOf(txt)).toBe("none");
    await press(page, cell.locator(".txt"));
    await expect.poll(() => filterOf(txt)).toBe("blur(7px)");
  });

  test("가리기 中文: 병음과 한글 발음까지 흐려진다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#hide-zh"));
    const cell = page.locator("#s1-basic .cell.zh").first();
    for(const part of [".txt", ".py", ".pron"]) await expect.poll(() => filterOf(cell.locator(part))).toBe("blur(7px)");
  });

  test("보기 설정 패널은 바깥을 누르면 닫힌다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    await openSettings(page);
    await page.mouse.click(10, 600);
    await expect(page.locator("#view-panel")).toHaveCount(0);
  });

  test("발음 버튼은 언어에 맞게 읽고, 가린 칸을 열지 않는다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#hide-ja"));
    await page.keyboard.press("Escape");
    await scrollToSection(page, "s1-greet");
    const first = page.locator("#s1-greet .entry").first();
    for(const l of ["ja", "zh", "en"]) await press(page, first.locator(`.cell.${l} .say`));
    await expect(first.locator(".cell.ja")).not.toHaveClass(/shown/);
    await scrollToSection(page, "s1-kana");
    await press(page, page.locator(".kana-set .k").first());
    await scrollToSection(page, "s1-pinyin");
    await press(page, page.locator(".tone-grid .k").first());
    const zh = await first.locator(".cell.zh .txt").innerText();
    expect(await spoken(page)).toEqual([
      { text: "おはようございます", lang: "ja-JP" },
      { text: zh, lang: "zh-CN" },
      { text: "Good morning.", lang: "en-US" },
      { text: "あ", lang: "ja-JP" },
      { text: "妈", lang: "zh-CN" },
    ]);
  });

  test("공부할 언어를 끄면 열과 전용 섹션이 사라지고, 새로고침해도 유지된다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#show-zh"));
    await page.keyboard.press("Escape");
    await expect(page.locator("#s1-greet .cell.zh")).toHaveCount(0);
    await expect(page.locator("#s1-pinyin")).toHaveCount(0);
    await expect(page.locator('.toc a[data-for="s1-pinyin"]')).toHaveCount(0);
    await expect(page.locator("#s1-greet .cell.ja").first()).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("tri.langs"))).toBe("ja,en");

    await page.reload(); await hydrated(page);
    await expect(page.locator("#s1-greet .cell.zh")).toHaveCount(0);
    for(const i of [0, 1, 2]){
      await press(page, stageNav(page).nth(i));
      expect(await overflowX(page), `${i + 1}단계`).toBeLessThanOrEqual(0);
    }
  });

  test("발음 표시를 끄면 후리가나, 병음, 한글 발음이 모두 숨겨진다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#show-pron"));
    for(const sel of [".pron", ".py", ".yomi", "rt"]) await expect(page.locator(`#s1-greet ${sel}`)).toHaveCount(0);
  });

  test("발음 버튼이 보여도 모든 단계에서 가로 스크롤이 생기지 않는다", async ({ page }) => {
    for(const slug of ["basic", "intermediate", "advanced"]){
      await page.goto(`/${slug}`); await hydrated(page);
      await expect(page.locator(".say").first()).toBeAttached();
      expect(await overflowX(page), slug).toBeLessThanOrEqual(0);
    }
  });

  test("스크롤하면 목차에 현재 주제가 표시된다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    await scrollToSection(page, "s1-food");
    await expect(page.locator('.toc a[data-for="s1-food"]')).toHaveAttribute("aria-current", "location");
  });

  test("여행 탭: 보여 주기 카드를 크게 띄우고, 언어를 바꾸면 기억한다", async ({ page }) => {
    await page.goto("/travel"); await hydrated(page);
    await expect(page.locator("h1")).toContainText("여행");
    const card = page.locator("#t-cards .show-card").first();
    const ja = await card.locator(".ja [lang=ja]").innerText();
    const zh = await card.locator(".zh [lang=zh-CN]").innerText();
    await press(page, card.locator(".show-btn"));
    const dialog = page.locator("dialog.show-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".show-text")).toHaveText(ja);
    await press(page, dialog.getByRole("radio", { name: "中文" }));
    await expect(dialog.locator(".show-text")).toHaveText(zh);
    await press(page, dialog.getByRole("button", { name: "🔊 들려주기" }));
    expect((await spoken(page)).at(-1)).toEqual({ text: zh, lang: "zh-CN" });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    // 다시 열면 마지막 언어(中文)로 열린다
    await press(page, page.locator("#t-cards .show-btn").nth(1));
    await expect(dialog.getByRole("radio", { name: "中文" })).toHaveAttribute("aria-checked", "true");
    await press(page, dialog.getByRole("button", { name: "닫기" }));
    await expect(dialog).toBeHidden();
  });

  test("여행 탭: 꺼 둔 언어는 카드와 크게 보기에서도 빠진다", async ({ page }) => {
    await page.goto("/travel"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#show-ja"));
    await page.keyboard.press("Escape");
    const card = page.locator("#t-cards .show-card").first();
    await expect(card.locator("li.ja")).toHaveCount(0);
    await press(page, card.locator(".show-btn"));
    await expect(page.locator("dialog.show-dialog").getByRole("radio", { name: "日本語" })).toHaveCount(0);
  });
});
