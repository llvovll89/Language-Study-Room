import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { PAGE_URL, press, filterOf, displayOf, scrollToSection } from "./helpers.js";

/* 빌드 결과 구조와 접근성 (JS 유무 상관없이 모든 프로젝트에서 실행) */
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test.describe("구조와 접근성", () => {
  test.beforeEach(async ({ page }) => { await page.goto(PAGE_URL); });

  test("footer에 package.json 버전이 표시된다", async ({ page }) => {
    const [maj, min, patch] = version.split(".");
    const v = `v${maj}.${min}${patch !== "0" ? "." + patch : ""}`;
    await expect(page.locator("footer .ver")).toHaveText(v);
  });

  test("id가 중복되지 않고, 모든 페이지 안 링크의 대상이 있다", async ({ page }) => {
    const result = await page.evaluate(() => {
      const ids = [...document.querySelectorAll("[id]")].map(e => e.id);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
      const broken = [...document.querySelectorAll('a[href^="#"]')]
        .map(a => a.getAttribute("href").slice(1))
        .filter(id => id && !document.getElementById(id));
      return { dup, broken };
    });
    expect(result.dup).toEqual([]);
    expect(result.broken).toEqual([]);
  });

  test("목차의 주제 수와 섹션 수가 같다", async ({ page }) => {
    for(const id of [1, 2, 3]){
      const secs = await page.locator(`#stage-${id} .sec`).count();
      await expect(page.locator(`.toc-group[data-stage="${id}"] a`)).toHaveCount(secs);
    }
  });

  test("단계 머리의 표현 개수가 실제 항목 수와 같다", async ({ page }) => {
    for(const id of [1, 2, 3]){
      const meta = await page.locator(`#stage-${id} .stage-meta`).innerText();
      const n = Number(meta.match(/표현 (\d+)개/)[1]);
      const actual = await page.locator(`#stage-${id} .sec:not([data-type="kana"]):not([data-type="pinyin"]) [data-text]`).count();
      expect(actual, `${id}단계`).toBe(n);
    }
  });

  test("모든 항목에 4개 언어 칸이 있고, 외국어 칸에는 한글 발음이 있다", async ({ page }) => {
    const missing = await page.evaluate(() => [...document.querySelectorAll(".entry")]
      .filter(e => ["ko", "ja", "zh", "en"].some(l => !e.querySelector(`.cell.${l}`)) ||
                   ["ja", "zh", "en"].some(l => !e.querySelector(`.cell.${l} .pron`)) ||
                   !e.querySelector(".cell.zh .py"))
      .map(e => e.dataset.text?.slice(0, 30) || e.closest(".pat")?.dataset.text.slice(0, 30)));
    expect(missing).toEqual([]);
  });

  test("발음 버튼은 모두 이름(aria-label)과 지원 언어를 가진다", async ({ page }) => {
    const bad = await page.evaluate(() => [...document.querySelectorAll("[data-say]")]
      .filter(b => !b.getAttribute("aria-label") || !["ja-JP", "zh-CN", "en-US"].includes(b.dataset.lang) || !b.dataset.say.trim())
      .length);
    expect(bad).toBe(0);
  });

  test("외국어 텍스트에 lang 속성이 있다 (스크린리더, 글꼴 선택)", async ({ page }) => {
    const bad = await page.evaluate(() => {
      const want = { ja: "ja", zh: "zh-CN", en: "en" };
      return [...document.querySelectorAll(".cell.ja .txt, .cell.zh .txt, .cell.en .txt")]
        .filter(t => t.getAttribute("lang") !== want[[...t.closest(".cell").classList].find(c => c in want)]).length;
    });
    expect(bad).toBe(0);
  });

  test("원본 표기 기호([ ] _ | 성조 숫자)가 화면 텍스트에 남지 않는다", async ({ page }) => {
    const leaked = await page.evaluate(() => [...document.querySelectorAll(".pron")]
      .map(p => p.textContent)
      .filter(t => /[\[\]_|]/.test(t) || /[가-힣][0-4]/.test(t)));
    expect(leaked).toEqual([]);
  });

  test("가리기 中文: 병음과 한글 발음까지 흐려지고, 누르면 그 칸만 보인다", async ({ page }) => {
    await press(page, page.locator(".view summary"));
    await press(page, page.locator('label[for="hide-zh"]'));
    await press(page, page.locator(".view summary"));
    await scrollToSection(page, "s1-basic");
    const cell = page.locator("#s1-basic .cell.zh").first();
    for(const part of [".txt", ".py", ".pron"]) await expect.poll(() => filterOf(cell.locator(part))).toBe("blur(7px)");
    await press(page, cell);
    await expect.poll(() => filterOf(cell.locator(".py"))).toBe("none");
  });

  test("발음 표시를 끄면 병음과 모든 한글 발음이 숨겨진다", async ({ page }) => {
    await press(page, page.locator(".view summary"));
    await press(page, page.locator('label[for="show-pron"]'));
    for(const sel of ["#s1-greet .cell.zh .py", "#s1-greet .cell.zh .pron", "#s1-greet .cell.en .pron"]){
      expect(await displayOf(page.locator(sel).first()), sel).toBe("none");
    }
  });

  test("중국어만 켜도 4열 표가 깨지지 않는다", async ({ page }) => {
    await press(page, page.locator(".view summary"));
    await press(page, page.locator('label[for="show-ja"]'));
    await press(page, page.locator('label[for="show-en"]'));
    await press(page, page.locator(".view summary"));
    // 모바일은 표가 카드형이라 머리글(th)이 없으므로 칸(td)으로 확인한다
    expect(await displayOf(page.locator("#s1-structure td.l-ja").first())).toBe("none");
    expect(await displayOf(page.locator("#s1-structure td.l-en").first())).toBe("none");
    await scrollToSection(page, "s1-structure");
    await expect(page.locator("#s1-structure td.l-zh").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
