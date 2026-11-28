import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import { buildStamp } from "./app/lib/pwaUpdate.ts";

/* 콘텐츠(data)와 발음 로직(lib)은 기존 HTML 빌드와 함께 쓰는 루트 폴더를 그대로 가져온다 */
const root = fileURLToPath(new URL("..", import.meta.url));
const { version } = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
/* footer 빌드 표시 (KST 빌드 시각 + 커밋). 배포 뒤 새 버전이 적용됐는지 확인하는 용도 */
const sha = process.env.VERCEL_GIT_COMMIT_SHA || (() => { try{ return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }catch{ return ""; } })();
// 클라이언트·서버(prerender) 빌드가 같은 값을 쓰도록 한 번 정하면 프로세스 안에서 유지 (다르면 하이드레이션 불일치)
const build = (process.env.APP_BUILD_STAMP ??= buildStamp(new Date(), sha));

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  define: { __APP_VERSION__: JSON.stringify(version), __APP_BUILD__: JSON.stringify(build) },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
      "@data": `${root}data`,
      "@lib": `${root}lib`,
    },
  },
  server: { fs: { allow: [root] } },
});
