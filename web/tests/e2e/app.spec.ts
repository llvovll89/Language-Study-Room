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
    await expect(page.locator(".stage-card")).toHaveCount(5);
    await press(page, page.locator(".cta"));
    await expect(page).toHaveURL(/\/basic$/);
    await expect(page.locator("h1")).toContainText("기본");
    await press(page, stageNav(page).nth(1));
    await expect(page).toHaveURL(/\/intermediate$/);
    await expect(stageNav(page).nth(1)).toHaveAttribute("aria-current", "page");
    await expect(page.locator('[data-topic="s2-cafe"]')).toHaveCount(1);
  });

  test("마지막으로 본 단계를 홈에서 이어서 볼 수 있다", async ({ page }) => {
    await page.goto("/advanced"); await hydrated(page);
    await page.goto("/"); await hydrated(page);
    await expect(page.locator(".cta")).toContainText("이어서 보기 · 심화");
    await expect(page.locator(".cta")).toHaveAttribute("href", "/advanced");
  });

  test("없는 주소는 404 화면을 보여 준다", async ({ page }) => {
    for(const path of ["/nope", "/basic/nope"]){
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
      await expect(page.locator("h1")).toHaveText("페이지를 찾을 수 없습니다");
    }
  });

  test("검색하면 맞는 항목만 남고, 없으면 안내가 나오고, 지우면 돌아온다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    const total = (await page.locator('[data-topic="s1-place"]').innerText()).match(/(\d+)개/)![1];
    await page.fill("#q", "station");
    const count = page.locator("#s1-place .count");
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
    await expect(page.locator(".topic-row")).toHaveCount(18);
    await expect(page.locator("#s1-place")).toHaveCount(0);
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
    await page.goto("/basic/greet"); await hydrated(page);
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
    await page.goto("/basic/basic"); await hydrated(page);
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
    await page.goto("/basic/greet"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#hide-ja"));
    await page.keyboard.press("Escape");
    const first = page.locator("#s1-greet .entry").first();
    for(const l of ["ja", "zh", "en"]) await press(page, first.locator(`.cell.${l} .say`));
    await expect(first.locator(".cell.ja")).not.toHaveClass(/shown/);
    const zh = await first.locator(".cell.zh .txt").innerText();
    expect(await spoken(page)).toEqual([
      { text: "おはようございます", lang: "ja-JP" },
      { text: zh, lang: "zh-CN" },
      { text: "Good morning.", lang: "en-US" },
    ]);
    // 글자표는 각자의 주제 페이지에 있다
    await page.goto("/basic/kana"); await hydrated(page);
    await press(page, page.locator(".kana-set .k").first());
    await page.goto("/basic/pinyin"); await hydrated(page);
    await press(page, page.locator(".tone-grid .k").first());
    expect(await spoken(page)).toEqual([{ text: "妈", lang: "zh-CN" }]);
  });

  test("공부할 언어를 끄면 열과 전용 주제가 사라지고, 새로고침해도 유지된다", async ({ page }) => {
    await page.goto("/basic/greet"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#show-zh"));
    await page.keyboard.press("Escape");
    await expect(page.locator("#s1-greet .cell.zh")).toHaveCount(0);
    await expect(page.locator("#s1-greet .cell.ja").first()).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("tri.langs"))).toBe("ja,en");

    await page.reload(); await hydrated(page);
    await expect(page.locator("#s1-greet .cell.zh")).toHaveCount(0);
    await page.goto("/basic"); await hydrated(page);
    await expect(page.locator('[data-topic="s1-pinyin"]')).toHaveCount(0);
    await expect(page.locator('[data-topic="s1-kana"]')).toHaveCount(1);
    await expect(page.locator(".topic-row")).toHaveCount(17);
    for(const i of [0, 1, 2]){
      await press(page, stageNav(page).nth(i));
      expect(await overflowX(page), `${i + 1}단계`).toBeLessThanOrEqual(0);
    }
    // 가나표 다음 주제는 (꺼 둔) 병음표를 건너뛴다
    await page.goto("/basic/kana"); await hydrated(page);
    await expect(page.locator(".pager a[rel=next]")).toHaveAttribute("href", "/basic/structure");
  });

  test("발음 표시를 끄면 후리가나, 병음, 한글 발음이 모두 숨겨진다", async ({ page }) => {
    await page.goto("/basic/greet"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#show-pron"));
    for(const sel of [".pron", ".py", ".yomi", "rt"]) await expect(page.locator(`#s1-greet ${sel}`)).toHaveCount(0);
  });

  test("발음 버튼이 보여도 단계 목록과 주제 페이지에 가로 스크롤이 생기지 않는다", async ({ page }) => {
    for(const path of ["/basic", "/basic/greet", "/basic/c-particle", "/intermediate/cafe", "/intermediate/pattern", "/advanced/keigo", "/travel/cards", "/toeic/part5"]){
      await page.goto(path); await hydrated(page);
      // 표만 있는 주제(경어)와 카드·문제 주제는 발음 버튼 대신 다른 버튼을 쓴다
      if(["/basic/greet", "/basic/c-particle", "/intermediate/cafe", "/intermediate/pattern"].includes(path)) await expect(page.locator(".say").first()).toBeAttached();
      expect(await overflowX(page), path).toBeLessThanOrEqual(0);
    }
  });

  /* v2.4 주제별 페이지 */
  test("단계 목록에서 주제를 열고, 이전/다음으로 이동하며, 끝까지 보면 완료로 표시된다", async ({ page }) => {
    await page.goto("/basic"); await hydrated(page);
    await expect(page.locator(".resume")).toContainText("첫 주제부터 시작");
    await press(page, page.locator('[data-topic="s1-greet"]'));
    await expect(page).toHaveURL(/\/basic\/greet$/);
    await expect(page.locator("h1")).toContainText("인사 표현");
    await expect(page.locator(".crumb .pos")).toHaveText("9 / 18");
    await expect(page).toHaveTitle(/인사 표현 · 1단계 기본/);

    // 아래까지 내리면 완료
    await page.locator(".pager").scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("tri.done"))).toBe('["s1-greet"]');
    await press(page, page.locator(".pager a[rel=next]"));
    await expect(page).toHaveURL(/\/basic\/basic$/);
    await expect(page.locator(".crumb .pos")).toHaveText("10 / 18");
    // 이전 버튼까지 내려갔으므로 두 번째 주제도 끝까지 본 것
    await press(page, page.locator(".pager a[rel=prev]"));
    await expect(page).toHaveURL(/\/basic\/greet$/);
    // 마지막으로 본 주제가 저장된 뒤에 넘어간다 (주소는 렌더링보다 먼저 바뀔 수 있다)
    await expect.poll(() => page.evaluate(() => localStorage.getItem("tri.last"))).toBe("/basic/greet");

    // 목록에 완료 표시, 이어서 보기는 마지막으로 연 주제
    await page.goto("/basic"); await hydrated(page);
    await expect(page.locator('[data-topic="s1-greet"]')).toHaveAttribute("data-done", "true");
    await expect(page.locator('[data-topic="s1-basic"]')).toHaveAttribute("data-done", "true");
    await expect(page.locator('[data-topic="s1-num"]')).not.toHaveAttribute("data-done");
    await expect(page.locator(".progress")).toContainText("완료 2 / 18");
    await expect(page.locator(".resume")).toContainText("이어서 보기 · 인사 표현");
    await page.goto("/"); await hydrated(page);
    await expect(page.locator(".cta")).toHaveAttribute("href", "/basic/greet");
  });

  test("첫 주제의 이전은 목록, 마지막 주제의 다음은 다음 단계, TOEIC 끝은 다음이 없다", async ({ page }) => {
    await page.goto("/intermediate/c-tense"); await hydrated(page);
    await expect(page.locator(".pager a[rel=prev]")).toHaveAttribute("href", "/intermediate");
    await page.goto("/intermediate/pattern"); await hydrated(page);
    await expect(page.locator(".pager a[rel=next]")).toHaveAttribute("href", "/advanced");
    await expect(page.locator(".pager a[rel=next]")).toContainText("3단계 심화");
    await page.goto("/toeic/travel"); await hydrated(page);
    await expect(page.locator(".pager a[rel=next]")).toHaveCount(0);
  });

  test("주제 페이지에서 검색하고 Enter를 누르면 단계 전체 검색 결과로 간다", async ({ page }) => {
    await page.goto("/basic/greet"); await hydrated(page);
    await page.fill("#q", "station");
    await page.locator("#q").press("Enter");
    await expect(page).toHaveURL(/\/basic$/);
    await expect(page.locator("#q")).toHaveValue("station");
    await expect(page.locator("#s1-place [data-item]").first()).toContainText("駅");
    // 결과의 주제 제목은 그 주제 페이지로 간다
    await press(page, page.locator("#s1-place h2 a"));
    await expect(page).toHaveURL(/\/basic\/place$/);
  });

  test("예전 주소(#섹션)는 새 주제 주소로 넘어간다", async ({ page }) => {
    await page.goto("/basic#s1-food"); await hydrated(page);
    await expect(page).toHaveURL(/\/basic\/food$/);
    await expect(page.locator("#s1-food")).toBeVisible();
  });

  test("데스크톱: 주제 페이지 옆 목록에 지금 주제가 표시된다", async ({ page }) => {
    test.skip(isMobile(page), "옆 목록은 넓은 화면 전용");
    await page.goto("/basic/food"); await hydrated(page);
    await expect(page.locator('.topic-nav a[data-for="s1-food"]')).toHaveAttribute("aria-current", "page");
    await press(page, page.locator('.topic-nav a[data-for="s1-time"]'));
    await expect(page).toHaveURL(/\/basic\/time$/);
    await expect(page.locator('.topic-nav a[data-for="s1-time"]')).toHaveAttribute("aria-current", "page");
  });

  test("여행 탭: 보여 주기 카드를 크게 띄우고, 언어를 바꾸면 기억한다", async ({ page }) => {
    await page.goto("/travel/cards"); await hydrated(page);
    await expect(page.locator("h1")).toContainText("보여 주기 카드");
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
    await page.goto("/travel/cards"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#show-ja"));
    await page.keyboard.press("Escape");
    const card = page.locator("#t-cards .show-card").first();
    await expect(card.locator("li.ja")).toHaveCount(0);
    await press(page, card.locator(".show-btn"));
    await expect(page.locator("dialog.show-dialog").getByRole("radio", { name: "日本語" })).toHaveCount(0);
  });

  /* v2.2 문제와 풀이 */
  /* 모든 문제에서 첫 보기를 고른다. 고른 뒤에는 정답 보기가 정확히 하나 표시돼야 한다 */
  const answerAll = async (page: import("@playwright/test").Page) => {
    const dialog = page.locator("dialog.quiz-dialog");
    const total = Number((await dialog.locator(".quiz-progress").innerText()).split("/")[1]);
    for(let n = 0; n < total; n++){
      await expect(dialog.locator(".quiz-progress")).toHaveText(`${n + 1} / ${total}`);
      await press(page, dialog.locator(".quiz-choices button").first());
      await expect(dialog.locator(".quiz-feedback")).toBeVisible();
      await expect(dialog.locator('.quiz-choices [data-state="correct"]')).toHaveCount(1);
      await press(page, dialog.locator(".quiz-next"));
    }
    return { dialog, total };
  };

  test("문제 풀기: 10문제를 풀면 점수가 나오고, 틀린 문제는 오답 노트로 다시 푼다", async ({ page }) => {
    await page.goto("/basic/food"); await hydrated(page);
    const sec = page.locator("#s1-food");
    await press(page, sec.locator(".quiz-start"));
    const { dialog, total } = await answerAll(page);
    expect(total).toBe(10);
    const result = await dialog.locator(".quiz-result p").first().innerText();
    const score = Number(result.split("/")[0].trim());
    await press(page, dialog.getByRole("button", { name: "닫기" }).last());
    await expect(dialog).toHaveCount(0);

    const wrong = await page.evaluate(() => JSON.parse(localStorage.getItem("tri.wrong") || "[]").filter((id: string) => id.startsWith("s1-food:")).length);
    expect(wrong).toBe(10 - score);
    if(wrong > 0){
      await expect(sec.locator(".quiz-retry")).toContainText(String(wrong));
      await press(page, sec.locator(".quiz-retry"));
      await expect(page.locator("dialog.quiz-dialog .quiz-progress")).toHaveText(`1 / ${wrong}`);
    } else {
      await expect(sec.locator(".quiz-retry")).toHaveCount(0);
    }
  });

  test("문제 풀기: 공부할 언어로 켠 언어로만 출제한다", async ({ page }) => {
    await page.goto("/intermediate/c-tense"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#show-ja"));
    await press(page, page.locator("#show-zh"));
    await page.keyboard.press("Escape");
    await press(page, page.locator("#s2-c-tense .quiz-start"));
    const dialog = page.locator("dialog.quiz-dialog");
    for(let n = 0; n < 5; n++){
      await expect(dialog.locator(".quiz-type")).toContainText("English");
      await press(page, dialog.locator(".quiz-choices button").first());
      await press(page, dialog.locator(".quiz-next"));
    }
  });

  test("문제 풀기: 검색 중에는 숨기고, 정답 확인 때 발음과 뜻을 보여 준다", async ({ page }) => {
    await page.goto("/travel/hotel"); await hydrated(page);
    await press(page, page.locator("#t-hotel .quiz-start"));
    const dialog = page.locator("dialog.quiz-dialog");
    await press(page, dialog.locator(".quiz-choices button").nth(1));
    const fb = dialog.locator(".quiz-feedback");
    await expect(fb.locator(".pron")).toBeVisible();
    await expect(fb).toContainText(/정답입니다|아쉬워요/);
    await page.keyboard.press("Escape");
    await page.goto("/travel"); await hydrated(page);
    await page.fill("#q", "체크");
    await expect(page.locator("#t-hotel [data-item]").first()).toBeVisible();
    await expect(page.locator(".quiz-start")).toHaveCount(0);
  });

  test("음성 엔진이 불완전해도(Utterance 없음) 문제 풀기가 끝까지 진행된다", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel(){}, speak(){} } });
      Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: undefined });
      delete (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance;
    });
    await page.goto("/intermediate/c-tense"); await hydrated(page);
    await page.locator("#s2-c-tense .quiz-start").click();
    const dialog = page.locator("dialog.quiz-dialog");
    const total = Number((await dialog.locator(".quiz-progress").innerText()).split("/")[1]);
    for(let n = 0; n < total; n++){
      await expect(dialog.locator(".quiz-progress")).toHaveText(`${n + 1} / ${total}`);
      await dialog.locator(".quiz-choices button").first().click();
      await dialog.locator(".quiz-next").click();
    }
    await expect(dialog.locator(".quiz-result")).toBeVisible();
    await ctx.close();
  });

  /* v2.3 TOEIC */
  test("TOEIC: 시험 구성 표, 표현 듣기, Part 5 문제를 바로 채점하고 해설을 보여 준다", async ({ page }) => {
    await page.goto("/toeic"); await hydrated(page);
    await expect(page.locator("h1")).toContainText("TOEIC");
    await page.goto("/toeic/about"); await hydrated(page);
    await expect(page.locator("#e-about tr").filter({ hasText: "Part 5" })).toContainText("30");
    await page.goto("/toeic/part1"); await hydrated(page);
    const item = page.locator("#e-part1 .toeic-item").first();
    await press(page, item.locator(".say"));
    expect((await spoken(page)).at(-1)?.lang).toBe("en-US");
    await page.goto("/toeic/part5"); await hydrated(page);
    const prob = page.locator("#e-part5 .problem").first();
    await press(page, prob.locator("[role=radio]").first());
    await expect(prob.locator(".problem-exp")).toBeVisible();
    await expect(prob.locator('[data-state="correct"]')).toHaveCount(1);
    await expect(prob.locator(".problem-answer")).toHaveCount(0);
  });

  test("TOEIC: 영어를 꺼 둬도 영어로 출제하고, Part 5 문제 풀기는 해설을 보여 준다", async ({ page }) => {
    await page.goto("/toeic/hr"); await hydrated(page);
    await openSettings(page);
    await press(page, page.locator("#show-en"));
    await page.keyboard.press("Escape");
    await press(page, page.locator("#e-hr .quiz-start"));
    const dialog = page.locator("dialog.quiz-dialog");
    await expect(dialog.locator(".quiz-type")).toContainText("English");
    await page.keyboard.press("Escape");
    await page.goto("/toeic/part5"); await hydrated(page);
    await press(page, page.locator("#e-part5 .quiz-start"));
    await expect(dialog.locator(".quiz-type")).toContainText("Part 5 문제");
    await press(page, dialog.locator(".quiz-choices button").first());
    await expect(dialog.locator(".quiz-exp")).toBeVisible();
  });
});
