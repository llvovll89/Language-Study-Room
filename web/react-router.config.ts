import type { Config } from "@react-router/dev/config";
import { STAGES, TOEIC, TRAVEL } from "../data/index.js";
import { allPaths } from "./app/lib/topics";

/* 런타임 서버 없이 정적 파일로 배포 (Vercel). 모든 페이지를 빌드 때 HTML로 미리 만든다
   주소 목록은 데이터에서 만든다: 홈, 단계 목록 5개, 주제 페이지 (섹션마다 하나) */
export default {
  ssr: false,
  prerender: () => allPaths([...STAGES, TRAVEL, TOEIC]),
} satisfies Config;
