/* react-router build 다음에 실행: 서비스 워커(sw.js) 생성
   (vite 플러그인 방식은 prerender 전에 실행돼 HTML을 놓치므로 빌드 후 단계로 만든다)

   v2.4.2: 새 버전을 받을 때 내려받는 양을 줄인다 (v2.4는 173개 파일, 5.5MB)
   - 미리 받기: 앱 뼈대(JS·CSS·아이콘·manifest), 홈(/), 404.html(앱 뼈대), 홈·단계 목록의 데이터(*.data)
   - 페이지 이동(HTML): 온라인이면 항상 네트워크. 오프라인이면 404.html(앱 뼈대)을 열고 앱이 데이터로 그린다
   - 주제 데이터(/basic/greet.data): 연 것만 저장 (온라인이면 새로 받음). 새 버전이 되면 옛 저장분은 지운다
   아이폰 홈 화면 앱은 받는 도중 앱을 닫으면 설치가 끊기므로, 미리 받는 양이 적을수록 업데이트가 잘 된다 */
import { copyFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { generateSW } from "workbox-build";

const dir = fileURLToPath(new URL("../build/client/", import.meta.url));

// 없는 주소와 오프라인 이동은 SPA fallback으로 열어 앱이 그린다 (Vercel은 404.html을 404 화면으로 자동 사용)
await copyFile(`${dir}__spa-fallback.html`, `${dir}404.html`);

/* 주제 데이터 저장소 이름은 빌드마다 다르게: 새 버전의 앱이 옛 버전 데이터(형식이 다를 수 있음)를 읽지 않게 한다
   빌드 결과(해시가 붙은 assets 파일 이름)로 정해 같은 빌드면 같은 이름이 된다 */
const assets = (await readdir(`${dir}assets`)).sort().join("\n");
const TOPICS_CACHE = `topics-${createHash("sha256").update(assets).digest("hex").slice(0, 10)}`;

// 새 서비스 워커가 화면을 넘겨받을 때 옛 버전의 주제 데이터 저장소를 지운다
await writeFile(`${dir}sw-cleanup.js`, `/* sw.mjs가 생성: 옛 버전 주제 데이터 정리 */
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith("topics-") && k !== ${JSON.stringify(TOPICS_CACHE)}).map(k => caches.delete(k))
  )));
});
`);

const { count, size, warnings } = await generateSW({
  globDirectory: dir,
  globPatterns: ["assets/**/*.{js,css}", "*.{svg,png,webmanifest}", "index.html", "404.html", "*.data"],
  swDest: `${dir}sw.js`,
  importScripts: ["sw-cleanup.js"],
  directoryIndex: "index.html",
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // 페이지 이동: 미리 받은 홈(/) 말고는 네트워크. 오프라인이면 앱 뼈대로 연다
      // (workbox는 NetworkOnly에 시간 제한을 허용하지 않는다)
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkOnly",
      options: { precacheFallback: { fallbackURL: "/404.html" } },
    },
    {
      // 주제 데이터: 온라인이면 새로 받고, 오프라인이면 한 번 연 것을 쓴다
      urlPattern: ({ url, sameOrigin }) => sameOrigin && /^\/[a-z]+\/[a-z0-9-]+\.data$/.test(url.pathname),
      handler: "NetworkFirst",
      options: { cacheName: TOPICS_CACHE, networkTimeoutSeconds: 4, expiration: { maxEntries: 150 }, cacheableResponse: { statuses: [200] } },
    },
    {
      urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
      handler: "CacheFirst",
      options: { cacheName: "google-fonts", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
    },
  ],
});
warnings.forEach(w => console.warn(w));
console.log(`sw.js: ${count}개 파일 precache (${(size / 1024).toFixed(0)} KB), 주제 데이터 저장소 ${TOPICS_CACHE}`);
