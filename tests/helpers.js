import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const PAGE_URL = pathToFileURL(resolve(import.meta.dirname, "../language-study.html")).href;

/* 모바일은 tap, 데스크톱은 click */
export const press = async (page, locator) => {
  const isMobile = page.viewportSize().width < 720;
  if(isMobile) await locator.tap();
  else await locator.click();
};

export const filterOf = locator => locator.evaluate(el => getComputedStyle(el).filter);
export const displayOf = locator => locator.evaluate(el => getComputedStyle(el).display);

export const shot = (page, testInfo, name, opts = {}) =>
  page.screenshot({ path: `test-results/screens/${testInfo.project.name}-${name}.png`, ...opts });

/* 섹션을 상단 바 아래로 스크롤 */
export const scrollToSection = (page, id) => page.evaluate(id => {
  document.documentElement.style.scrollBehavior = "auto";
  const el = document.getElementById(id);
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 130);
}, id);
