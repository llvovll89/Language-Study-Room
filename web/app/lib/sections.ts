/* 섹션 판별과 페이지 데이터 타입 (데이터 값을 import하지 않는 순수 모듈) */
import type { Kana, Pinyin, Section, Stage } from "@data";
import type { Slug } from "./stages";

export const isConcept = (s: Section) => s.type === "concept" || ("concept" in s && s.concept === true);
export const isChart = (s: Section) => s.type === "kana" || s.type === "pinyin";

export interface StageMeta {
  id: number; slug: Slug; name: string; short: string; desc: string;
  sections: number; concepts: number; items: number;
}

export interface Charts {
  kana: { seion: (Kana | null)[]; dakuon: Kana[]; yoon: Kana[] } | null;
  pinyin: Pinyin | null;
}

export interface StagePayload {
  stage: Stage;
  /** 섹션 id → 전체 개수 (글자표는 글자 수) */
  counts: Record<string, number>;
  /** 단계 전체 표현 수 (글자표 제외) */
  total: number;
  charts: Charts;
}
