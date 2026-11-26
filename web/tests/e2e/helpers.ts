import type { Locator, Page } from "@playwright/test";

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

/* 모바일은 tap, 데스크톱은 click */
export const press = async (page: Page, locator: Locator) => {
  if(isMobile(page)) await locator.tap();
  else await locator.click();
};

export const filterOf = (l: Locator) => l.evaluate(el => getComputedStyle(el).filter);

/* 섹션을 상단 바 아래로 스크롤 */
export const scrollToSection = (page: Page, id: string) => page.evaluate(id => {
  document.documentElement.style.scrollBehavior = "auto";
  const el = document.getElementById(id)!;
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 140);
}, id);

export const overflowX = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/* 발음 호출을 기록하는 가짜 speechSynthesis */
export const fakeSpeech = (page: Page) => page.addInitScript(() => {
  (window as unknown as { __spoken: unknown[] }).__spoken = [];
  class FakeUtterance { text: string; lang = ""; rate = 1; constructor(text: string){ this.text = text; } }
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = FakeUtterance;
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: { cancel(){}, speak(u: FakeUtterance){ (window as unknown as { __spoken: unknown[] }).__spoken.push({ text: u.text, lang: u.lang }); } },
  });
});

export const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: { text: string; lang: string }[] }).__spoken);

/* 하이드레이션이 끝나 설정 패널이 반응할 때까지 기다린다 */
export const hydrated = (page: Page) => page.locator("html[data-hydrated]").waitFor({ state: "attached", timeout: 20_000 });

export const openSettings = async (page: Page) => {
  await press(page, page.locator(".view > button"));
  await page.locator("#view-panel").waitFor();
};
