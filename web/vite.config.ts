import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

/* 콘텐츠(data)와 발음 로직(lib)은 기존 HTML 빌드와 함께 쓰는 루트 폴더를 그대로 가져온다 */
const root = fileURLToPath(new URL("..", import.meta.url));
const { version } = JSON.parse(readFileSync(`${root}package.json`, "utf8"));

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
      "@data": `${root}data`,
      "@lib": `${root}lib`,
    },
  },
  server: { fs: { allow: [root] } },
});
