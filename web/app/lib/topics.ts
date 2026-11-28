/* 주제(섹션) 페이지 주소와 진도 (데이터 값과 React를 import하지 않는 순수 모듈)
   react-router.config.ts의 prerender 목록과 단위 테스트도 이 파일을 쓴다 */

/** URL 슬러그 ↔ 단계 (data의 [...STAGES, TRAVEL, TOEIC] 순서) */
export const SLUGS = ["basic", "intermediate", "advanced", "travel", "toeic"] as const;
export type Slug = (typeof SLUGS)[number];

/** 섹션 id → 주제 주소: 앞의 "s1-", "t-", "e-"를 뗀다 (s1-greet → greet). 검증은 scripts/validate-data.mjs */
export const topicSlug = (sectionId: string) => sectionId.replace(/^[a-z]\d?-/, "");

export const topicPath = (stage: string, sectionId: string) => `/${stage}/${topicSlug(sectionId)}`;

/** prerender할 모든 주소: 홈, 단계 목록, 주제 페이지 */
export const allPaths = (stages: { sections: { id: string }[] }[]) => [
  "/",
  ...stages.flatMap((st, i) => [`/${SLUGS[i]}`, ...st.sections.map(s => topicPath(SLUGS[i], s.id))]),
];

/* ───────── 진도 (localStorage) ─────────
   tri.done: 끝까지 본 주제의 섹션 id 목록 (JSON)
   tri.last: 마지막으로 연 주제 주소 (/basic/greet) */
export const DONE_KEY = "tri.done";
export const LAST_KEY = "tri.last";

type Get = (k: string) => string | null;

export const readDone = (get: Get): string[] => {
  try{
    const v = JSON.parse(get(DONE_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  }catch{ return []; }
};

export const addDone = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

/** 마지막 주제가 이 단계 것일 때만 그 주소 (형식이 틀리면 null) */
export const lastInStage = (last: string | null, stage: string) =>
  last && new RegExp(`^/${stage}/[a-z0-9-]+$`).test(last) ? last : null;
