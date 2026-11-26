import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { fakeSpeech, hydrated } from "./helpers";

/* prerender된 HTML 구조와 접근성 (JS 유무 상관없이 실행) */
const { version } = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
const VERSION = `v${version.replace(/\.0$/, "")}`;
const ready = async (page: import("@playwright/test").Page, js: boolean | undefined) => { if(js !== false) await hydrated(page); };

test.describe("prerender HTML과 구조", () => {
  test("JS 없이도 여행 탭의 보여 주기 카드 내용이 HTML에 있다", async ({ page, javaScriptEnabled }) => {
    test.skip(javaScriptEnabled !== false, "JS 끔 전용");
    await page.goto("/travel");
    const cards = page.locator("#t-cards .show-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(20);
    await expect(cards.first().locator(".ja [lang=ja]")).toBeVisible();
    // 크게 보기와 문제 풀기 버튼은 JS가 있을 때만
    await expect(page.locator(".show-btn")).toHaveCount(0);
    await expect(page.locator(".quiz-start")).toHaveCount(0);
  });

  test("JS 없이도 TOEIC 시험 구성, 표현, Part 5 정답과 해설을 볼 수 있다", async ({ page, javaScriptEnabled }) => {
    test.skip(javaScriptEnabled !== false, "JS 끔 전용");
    await page.goto("/toeic");
    await expect(page.locator("#e-about")).toContainText("200");
    expect(await page.locator("#e-part1 .toeic-item").count()).toBeGreaterThanOrEqual(15);
    const first = page.locator("#e-part5 .problem").first();
    await first.locator("summary").click();
    await expect(first.locator(".problem-answer")).toContainText("정답:");
  });

  test("JS 없이도 단계 내용과 단계 링크가 HTML에 있다", async ({ page, javaScriptEnabled }) => {
    test.skip(javaScriptEnabled !== false, "JS 끔 전용");
    await page.goto("/basic");
    await expect(page.locator("#s1-greet .entry").first()).toContainText("안녕하세요");
    expect(await page.locator("[data-item]").count()).toBeGreaterThan(250);
    await page.locator(".tabbar a").nth(2).click();
    await expect(page).toHaveURL(/\/advanced$/);
    await expect(page.locator("#s3-dev .entry").first()).toBeVisible();
  });

  test("footer에 package.json 버전이 표시된다", async ({ page, javaScriptEnabled }) => {
    await page.goto("/"); await ready(page, javaScriptEnabled);
    await expect(page.locator("footer .ver")).toHaveText(VERSION);
  });

  for(const slug of ["basic", "intermediate", "advanced", "travel", "toeic"]){
    test(`${slug}: id 중복 없음, 링크 대상 있음, 모든 항목에 4개 언어와 발음`, async ({ page, javaScriptEnabled }) => {
      await page.goto(`/${slug}`); await ready(page, javaScriptEnabled);
      const r = await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map(e => e.id);
        const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
        const broken = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute("href")!.slice(1)).filter(id => !document.getElementById(id));
        const missing = [...document.querySelectorAll(".entry")].filter(e =>
          ["ko", "ja", "zh", "en"].some(l => !e.querySelector(`.cell.${l}`)) ||
          ["ja", "zh", "en"].some(l => !e.querySelector(`.cell.${l} .pron`)) || !e.querySelector(".cell.zh .py")).length;
        const leaked = [...document.querySelectorAll(".pron")].map(p => p.textContent!).filter(t => /[[\]_|]/.test(t) || /[가-힣][0-4]/.test(t));
        const want: Record<string, string> = { ja: "ja", zh: "zh-CN", en: "en" };
        const badLang = [...document.querySelectorAll(".cell.ja .txt, .cell.zh .txt, .cell.en .txt")]
          .filter(t => t.getAttribute("lang") !== want[[...t.closest(".cell")!.classList].find(c => c in want)!]).length;
        return { dup, broken, missing, leaked, badLang };
      });
      expect(r).toEqual({ dup: [], broken: [], missing: 0, leaked: [], badLang: 0 });
    });
  }

  test("발음 버튼은 이름(aria-label)과 지원 언어를 가진다", async ({ page, javaScriptEnabled }) => {
    test.skip(javaScriptEnabled === false, "발음 버튼은 JS로 그린다");
    await fakeSpeech(page);
    await page.goto("/basic"); await hydrated(page);
    await expect(page.locator(".say").first()).toBeAttached();
    const bad = await page.evaluate(() => [...document.querySelectorAll("[data-say]")]
      .filter(b => !b.getAttribute("aria-label") || !["ja-JP", "zh-CN", "en-US"].includes((b as HTMLElement).dataset.lang!)).length);
    expect(bad).toBe(0);
  });

  test("개념 섹션은 '개념' 표시, 비교 표, 예문을 가진다", async ({ page, javaScriptEnabled }) => {
    await page.goto("/intermediate"); await ready(page, javaScriptEnabled);
    const concepts = page.locator('section[data-type="concept"]');
    expect(await concepts.count()).toBeGreaterThanOrEqual(5);
    const first = concepts.first();
    await expect(first.locator("h3 .kind")).toHaveText("개념");
    await expect(first.locator("table")).toHaveCount(1);
    expect(await first.locator(".entry").count()).toBeGreaterThanOrEqual(3);
    const id = await first.getAttribute("id");
    await expect(page.locator(`.toc a[data-for="${id}"] .kind`)).toHaveCount(1);
  });

  test("목차의 '개념' 배지는 긴 제목이나 선택 상태에서도 한 줄로 보인다", async ({ page, javaScriptEnabled, isMobile }) => {
    test.skip(isMobile, "세로 목차는 데스크톱 전용");
    for(const slug of ["basic", "intermediate", "advanced"]){
      await page.goto(`/${slug}`); await ready(page, javaScriptEnabled);
      const bad = await page.evaluate(() => [...document.querySelectorAll(".toc a .kind")]
        .filter(b => { const r = b.getBoundingClientRect(); return r.height > 22 || r.width < 24; })
        .map(b => b.closest("a")!.textContent));
      expect(bad, slug).toEqual([]);
    }
    // 선택된 항목에서는 배지가 반전돼 배경과 구분된다
    await page.goto("/intermediate"); await ready(page, javaScriptEnabled);
    const first = page.locator(".toc a").first();
    if(await first.getAttribute("aria-current")){
      const [bg, badge] = await first.evaluate(a => [getComputedStyle(a).backgroundColor, getComputedStyle(a.querySelector(".kind")!).backgroundColor]);
      expect(badge).not.toBe(bg);
    }
  });

  test("단계 탭 이름은 기본, 중급, 심화이고 SEO 제목이 있다", async ({ page, javaScriptEnabled }) => {
    await page.goto("/intermediate"); await ready(page, javaScriptEnabled);
    await expect(page.locator(".tabbar a span")).toHaveText(["기본", "중급", "심화", "여행", "TOEIC"]);
    await expect(page).toHaveTitle(/2단계 중급/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
  });
});
