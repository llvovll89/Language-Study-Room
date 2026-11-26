import { defineConfig, devices } from "@playwright/test";

/* 모든 프로젝트를 offline + file:// 로 실행해서 "데이터 없는 휴대폰" 조건을 재현한다 */
export default defineConfig({
  testDir: "./tests",
  // tests/unit은 node --test로 따로 돌린다
  testIgnore: "**/unit/**",
  timeout: 20_000,
  expect: { timeout: 3_000 },
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    offline: true,
    actionTimeout: 5_000,
  },
  projects: [
    {
      // 아이폰 파일 앱 미리보기 조건: WebKit, JS 꺼짐
      name: "iphone13-nojs",
      use: { ...devices["iPhone 13"], javaScriptEnabled: false },
    },
    {
      // 아이폰 Safari 조건: WebKit, JS 켜짐
      name: "iphone13-js",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "desktop-chromium",
      // PC에 설치된 Chrome 사용 (별도 브라우저 다운로드 없음)
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 } },
    },
  ],
});
