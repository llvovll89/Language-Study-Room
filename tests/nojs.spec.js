import { test, expect } from "@playwright/test";
import { PAGE_URL, press, filterOf, displayOf, shot, scrollToSection } from "./helpers.js";

/* 아이폰 파일 앱 미리보기 조건 (JS 꺼짐, 오프라인) */
test.describe("JS 없이 열었을 때", () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled !== false, "JS 끔 프로젝트 전용");

  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE_URL);
  });

  test("1~3단계 내용이 모두 HTML에 보인다", async ({ page }, testInfo) => {
    await expect(page.locator("html")).toHaveClass("no-js");
    for(const id of [1, 2, 3]) await expect(page.locator(`#stage-${id}`)).toBeVisible();
    await expect(page.locator("#s1-greet .entry").first()).toContainText("안녕하세요");
    await expect(page.locator("#s3-dev .entry")).toHaveCount(12);
    expect(await page.locator("[data-text]").count()).toBeGreaterThan(300);
    await shot(page, testInfo, "01-top");
  });

  test("가로 스크롤이 생기지 않는다", async ({ page }) => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("JS가 필요한 검색창과 발음 버튼은 숨겨진다", async ({ page }) => {
    await expect(page.locator(".search")).toBeHidden();
    await expect(page.locator(".say").first()).toBeHidden();
  });

  test("가리기: 체크하면 흐려지고, 칸을 누르면 그 칸만 보인다", async ({ page }, testInfo) => {
    const cell = page.locator("#s1-greet .cell.en").first();
    const txt = cell.locator(".txt");
    expect(await filterOf(txt)).toBe("none");

    await press(page, page.locator(".view summary"));
    await expect(page.locator(".view-panel")).toBeVisible();
    await press(page, page.locator('label[for="hide-en"]'));
    await expect(page.locator("#hide-en")).toBeChecked();
    await press(page, page.locator(".view summary"));
    await expect(page.locator(".view-panel")).toBeHidden();

    await scrollToSection(page, "s1-greet");
    await expect.poll(() => filterOf(txt)).toBe("blur(7px)");
    await shot(page, testInfo, "02-hidden-en");

    await press(page, cell);
    await expect.poll(() => filterOf(txt)).toBe("none");
    // 다른 칸은 계속 가려져 있어야 한다
    expect(await filterOf(page.locator("#s1-greet .cell.en .txt").nth(1))).toBe("blur(7px)");
    await shot(page, testInfo, "03-revealed-one");
  });

  test("히라가나와 가타카나를 전환한다", async ({ page }, testInfo) => {
    await scrollToSection(page, "s1-kana");
    await expect(page.locator(".kana-set.hira .k b").first()).toHaveText("あ");
    expect(await displayOf(page.locator(".kana-set.kata"))).toBe("none");

    await press(page, page.locator('label[for="kana-kata"]'));
    expect(await displayOf(page.locator(".kana-set.hira"))).toBe("none");
    await expect(page.locator(".kana-set.kata .k b").first()).toHaveText("ア");
    await expect(page.locator(".kana-set.kata .k b").first()).toBeVisible();
    await shot(page, testInfo, "04-katakana");
  });

  test("발음과 후리가나 표시를 끈다", async ({ page }) => {
    await expect(page.locator("#s1-greet .pron").first()).toBeVisible();
    await press(page, page.locator(".view summary"));
    await press(page, page.locator('label[for="show-pron"]'));
    await expect(page.locator("#s1-greet .pron").first()).toBeHidden();
    await expect(page.locator("#s1-num rt").first()).toBeHidden();
  });

  test("하단 탭바로 3단계 위치로 이동한다", async ({ page }) => {
    await press(page, page.locator(".tabbar a").nth(2));
    await expect(page).toHaveURL(/#stage-3$/);
    await expect(page.locator("#stage-3 .stage-head")).toBeInViewport();
    // JS 없을 때는 특정 단계를 선택된 것처럼 표시하지 않는다
    await expect(page.locator('.tabbar a[aria-current]')).toHaveCount(0);
  });

  test("표는 모바일에서 카드형으로 보인다", async ({ page }, testInfo) => {
    await scrollToSection(page, "s3-keigo");
    expect(await displayOf(page.locator("#s3-keigo thead"))).toBe("none");
    expect(await displayOf(page.locator("#s3-keigo tr").nth(1))).toBe("block");
    await shot(page, testInfo, "05-table-cards");
  });
});
