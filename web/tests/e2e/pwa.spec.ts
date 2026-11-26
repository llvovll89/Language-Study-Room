import { expect, test } from "@playwright/test";
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

  test("서비스 워커가 등록되고, 오프라인에서도 모든 단계가 열린다", async ({ page, context }) => {
    await page.goto("/"); await hydrated(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    // 첫 방문 페이지가 서비스 워커의 제어를 받을 때까지
    await page.reload(); await hydrated(page);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    for(const slug of ["basic", "intermediate", "advanced", "travel"]){
      await page.goto(`/${slug}`);
      await expect(page.locator(".stage-head h1")).toBeVisible();
      await expect(page.locator(".entry").first()).toBeVisible();
    }
    await context.setOffline(false);
  });
});
