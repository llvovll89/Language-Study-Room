import { expect, test, type Page } from "@playwright/test";
import { deployServer } from "./deploy-server";
import { hydrated } from "./helpers";

/* PWA: manifest, 서비스 워커, 오프라인 (서비스 워커 테스트가 안정적인 Chrome에서만) */
test.describe("PWA", () => {
  test.skip(({ browserName, javaScriptEnabled }) => browserName !== "chromium" || javaScriptEnabled === false, "Chrome 전용");

  test("manifest가 연결되고 필수 항목과 아이콘이 있다", async ({ page, request }) => {
    await page.goto("/");
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    const res = await request.get(href!);
    expect(res.ok()).toBe(true);
    const m = await res.json();
    expect(m).toMatchObject({ name: "네 언어 공부노트", start_url: "/", display: "standalone" });
    for(const icon of m.icons) expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
  });

  /* v2.4.2: 미리 받기는 앱 뼈대만. 주제 데이터는 연 것만 저장 */
  test("서비스 워커는 앱 뼈대와 단계 목록 데이터만 미리 받고, 주제 페이지는 미리 받지 않는다", async ({ request }) => {
    const sw = await (await request.get("/sw.js")).text();
    for(const url of ['"index.html"', '"404.html"', '"_.data"', '"basic.data"', '"toeic.data"', '"manifest.webmanifest"']) expect(sw, url).toContain(url);
    expect(sw).not.toContain("basic/greet");
    expect(sw).not.toContain("basic/index.html");
    expect((sw.match(/url:"/g) || []).length).toBeLessThan(40);
  });

  test("오프라인: 단계 목록은 모두 열리고, 연 주제는 열리고, 안 연 주제는 안내가 나온다", async ({ page, context }) => {
    await page.goto("/"); await hydrated(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    // 첫 방문 페이지가 서비스 워커의 제어를 받을 때까지
    await page.reload(); await hydrated(page);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    // 온라인에서 주제 두 개를 연다: 앱 안 이동 하나, 전체 페이지 이동(주소 입력) 하나
    await page.goto("/basic"); await hydrated(page);
    await page.locator('[data-topic="s1-greet"]').click();
    await expect(page.locator("#s1-greet [data-item]").first()).toBeVisible();
    await page.goto("/travel/cards"); await hydrated(page);
    const saved = () => page.evaluate(async () => {
      const name = (await caches.keys()).find(k => k.startsWith("topics-"));
      return name ? (await (await caches.open(name)).keys()).map(r => new URL(r.url).pathname).sort() : [];
    });
    await expect.poll(saved).toEqual(["/basic/greet.data", "/travel/cards.data"]);

    await context.setOffline(true);
    for(const slug of ["basic", "intermediate", "advanced", "travel", "toeic"]){
      await page.goto(`/${slug}`);
      await expect(page.locator(".stage-head h1"), slug).toBeVisible();
      await expect(page.locator(".topic-row").first()).toBeVisible();
    }
    await page.goto("/basic/greet");
    await expect(page.locator("#s1-greet [data-item]").first()).toBeVisible();
    await page.goto("/travel/cards");
    await expect(page.locator("#t-cards .show-card").first()).toBeVisible();

    // 안 연 주제: 주소로 열기, 앱 안에서 누르기 모두 안내
    await page.goto("/advanced/dev");
    await expect(page.locator(".offline-msg h1")).toHaveText("오프라인이라 열 수 없어요");
    await expect(page.locator(".offline-msg a", { hasText: "주제 목록으로" })).toHaveAttribute("href", "/advanced");
    await page.goto("/basic"); await hydrated(page);
    await page.locator('[data-topic="s1-num"]').click();
    await expect(page.locator(".offline-msg h1")).toBeVisible();

    // 연 주제는 앱 안 이동으로도 열린다
    await page.goto("/basic"); await hydrated(page);
    await page.locator('[data-topic="s1-greet"]').click();
    await expect(page.locator("#s1-greet [data-item]").first()).toBeVisible();
    await context.setOffline(false);
  });

  /* v2.4.1 자동 업데이트: 테스트마다 따로 띄운 서버에서 deploy()로 sw.js를 바꿔 '새 버전 배포'를 흉내 낸다 */
  test.describe("자동 업데이트", () => {
    let srv: Awaited<ReturnType<typeof deployServer>>;
    test.beforeEach(async () => { srv = await deployServer(); });
    test.afterEach(async () => { await srv?.close(); });

    const installed = async (page: Page) => {
      await page.goto(`${srv.origin}/basic`); await hydrated(page);
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload(); await hydrated(page);
      await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    };
    // 새로고침되면 사라지는 표시
    const mark = (page: Page) => page.evaluate(() => { (window as unknown as { __old: boolean }).__old = true; });
    // 새로고침 도중이면 아직 옛 화면으로 보고 poll이 다시 확인하게 한다
    const isOld = (page: Page) => page.evaluate(() => !!(window as unknown as { __old?: boolean }).__old).catch(() => true);
    const swChanges = (page: Page) => page.evaluate(() => {
      const w = window as unknown as { __cc: number };
      w.__cc = 0;
      navigator.serviceWorker.addEventListener("controllerchange", () => w.__cc++);
    });
    const changed = (page: Page) => page.evaluate(() => (window as unknown as { __cc: number }).__cc);

    test("첫 설치는 업데이트로 보지 않는다 (새로고침·안내 없음)", async ({ page }) => {
      await page.goto(`${srv.origin}/basic`); await hydrated(page);
      await mark(page);
      await page.evaluate(() => navigator.serviceWorker.ready);
      await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
      await page.waitForTimeout(1500);
      expect(await isOld(page)).toBe(true);
      await expect(page.locator(".update-toast")).toHaveCount(0);
    });

    test("새 버전이 배포된 뒤 앱을 열면 바로 새 버전으로 바뀌고 안내가 나온다", async ({ page }) => {
      await installed(page);
      srv.deploy();
      // 앱을 다시 연다: 옛 서비스 워커가 화면을 그리고, 등록할 때 새 sw.js를 찾아 넘겨받으면 5초 안이라 바로 새로고침
      await page.reload(); await hydrated(page);
      await expect(page.locator(".update-toast")).toHaveText("새 버전으로 업데이트했어요", { timeout: 15_000 });
      await expect(page.locator(".update-toast")).toHaveCount(0, { timeout: 6_000 });
      expect(await page.evaluate(() => sessionStorage.getItem("tri.updated"))).toBeNull();
    });

    test("사용 중에 찾은 새 버전은 다음 링크를 누를 때 그 주소를 새 버전으로 연다", async ({ page }) => {
      await installed(page);
      await page.waitForTimeout(5_500); // 실행 직후 5초가 지남
      await mark(page); await swChanges(page);
      srv.deploy();
      // 백그라운드에서 돌아온 것처럼: 새 버전 확인
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      await expect.poll(() => changed(page), { timeout: 15_000 }).toBe(1);
      await page.waitForTimeout(500);
      expect(await isOld(page), "읽는 중에는 새로고침하지 않는다").toBe(true);
      await page.locator('[data-topic="s1-greet"]').click();
      await expect(page).toHaveURL(/\/basic\/greet$/);
      await expect.poll(() => isOld(page)).toBe(false);
      await expect(page.locator(".update-toast")).toBeVisible();
      await expect(page.locator("#s1-greet")).toBeVisible();
    });

    test("사용 중에 찾은 새 버전은 앱을 백그라운드로 보낼 때 적용한다", async ({ page }) => {
      await installed(page);
      await page.waitForTimeout(5_500);
      await mark(page); await swChanges(page);
      srv.deploy();
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      await expect.poll(() => changed(page), { timeout: 15_000 }).toBe(1);
      expect(await isOld(page)).toBe(true);
      // 백그라운드로 가면 바로 새로고침되므로 이 evaluate는 중간에 끊길 수 있다
      await page.evaluate(() => {
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
        document.dispatchEvent(new Event("visibilitychange"));
      }).catch(() => {});
      await expect.poll(() => isOld(page)).toBe(false);
      await expect(page).toHaveURL(/\/basic$/);
    });

    test("문제 풀기가 열려 있으면 업데이트를 미룬다", async ({ page }) => {
      await installed(page);
      await page.goto(`${srv.origin}/basic/food`); await hydrated(page);
      await page.locator("#s1-food .quiz-start").click();
      await expect(page.locator("dialog.quiz-dialog")).toBeVisible();
      await mark(page); await swChanges(page);
      srv.deploy();
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      await expect.poll(() => changed(page), { timeout: 15_000 }).toBe(1);
      await page.waitForTimeout(500);
      expect(await isOld(page)).toBe(true);
      await expect(page.locator("dialog.quiz-dialog")).toBeVisible();
    });
  });

  test("footer에 빌드 시각이 표시된다", async ({ page }) => {
    await page.goto("/"); await hydrated(page);
    await expect(page.locator("footer .build")).toHaveText(/^\d{2}-\d{2} \d{2}:\d{2}( · [0-9a-f]{7})?$/);
  });
});
