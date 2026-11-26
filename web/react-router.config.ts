import type { Config } from "@react-router/dev/config";

/* 런타임 서버 없이 정적 파일로 배포 (Vercel). 모든 페이지를 빌드 때 HTML로 미리 만든다 */
export default {
  ssr: false,
  prerender: ["/", "/basic", "/intermediate", "/advanced"],
} satisfies Config;
