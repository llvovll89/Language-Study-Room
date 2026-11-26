/* react-router build 다음에 실행: prerender된 HTML까지 모두 precache하는 서비스 워커 생성
   (vite 플러그인 방식은 prerender 전에 실행돼 HTML을 놓치므로 빌드 후 단계로 만든다) */
import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { generateSW } from "workbox-build";

const dir = fileURLToPath(new URL("../build/client/", import.meta.url));

// 없는 주소는 SPA fallback으로 열어 앱의 404 화면을 보여 준다 (Vercel은 404.html을 자동 사용)
await copyFile(`${dir}__spa-fallback.html`, `${dir}404.html`);

const { count, size, warnings } = await generateSW({
  globDirectory: dir,
  globPatterns: ["**/*.{html,js,css,svg,png,webmanifest,data}"],
  globIgnores: ["__spa-fallback.html"],
  swDest: `${dir}sw.js`,
  directoryIndex: "index.html",
  // basic/index.html은 실제 주소인 /basic으로 precache (Vercel cleanUrls와 같은 주소)
  manifestTransforms: [async entries => ({
    manifest: entries.map(e => /.+\/index\.html$/.test(e.url) ? { ...e, url: e.url.replace(/\/index\.html$/, "") } : e),
    warnings: [],
  })],
  navigateFallback: "/404.html",
  navigateFallbackDenylist: [/\.data$/, /^\/assets\//],
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
      handler: "CacheFirst",
      options: { cacheName: "google-fonts", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
    },
  ],
});
warnings.forEach(w => console.warn(w));
console.log(`sw.js: ${count}개 파일 precache (${(size / 1024).toFixed(0)} KB)`);
