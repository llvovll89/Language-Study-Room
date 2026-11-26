import { defineConfig, devices } from "@playwright/test";

/* 빌드 결과(build/client)를 Vercel과 같은 규칙의 정적 서버로 띄워 테스트한다
   먼저 npm run build 필요 (루트의 npm run web:test가 빌드까지 실행) */
const PORT = 4180;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  // 한 단계 페이지의 하이드레이션이 1~2초 걸리므로 동시 실행 수를 제한한다
  workers: 4,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, actionTimeout: 5_000 },
  webServer: {
    command: `node scripts/serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: true,
  },
  projects: [
    { name: "iphone13", use: { ...devices["iPhone 13"] } },
    { name: "iphone13-nojs", use: { ...devices["iPhone 13"], javaScriptEnabled: false } },
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 } } },
  ],
});
