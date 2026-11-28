/* 섹션 판별과 페이지 데이터 타입 (데이터 값을 import하지 않는 순수 모듈) */
import type { Kana, Pinyin, Section, Stage } from "@data";
import type { Slug } from "./topics";

export const isConcept = (s: Section) => s.type === "concept" || ("concept" in s && s.concept === true);
export const isChart = (s: Section) => s.type === "kana" || s.type === "pinyin";

/** 주제 목록에 붙이는 종류 표시 (일반 단어·표현은 표시 없음) */
export const kindOf = (s: Section): string =>
  isConcept(s) ? "개념" : isChart(s) ? "글자표" :
  s.type === "dialog" ? "회화" : s.type === "pattern" ? "문형" : s.type === "card" ? "카드" :
  s.type === "problems" ? "문제" : "";

export interface StageMeta {
  id: number; slug: Slug; name: string; short: string; desc: string;
  sections: number; concepts: number; items: number;
}

export interface Charts {
  kana: { seion: (Kana | null)[]; dakuon: Kana[]; yoon: Kana[] } | null;
  pinyin: Pinyin | null;
}

/** 주제 목록 한 줄 (단계 페이지, 주제 페이지 옆 목록, 이전/다음) */
export interface TopicMeta {
  /** 섹션 id */
  id: string;
  /** 주제 주소 (/basic/greet) */
  path: string;
  title: string;
  kind: string;
  /** 표현 수 (글자표는 글자 수) */
  count: number;
  chart: boolean;
  /** 언어 전용 섹션(가나표, 병음표)의 언어 */
  lang?: "ja" | "zh";
}

export interface PartMeta { title: string; desc?: string; topics: TopicMeta[] }

/** 단계 페이지: 주제 목록 + 단계 전체 검색용 섹션 데이터 */
export interface StagePayload {
  stage: Stage;
  slug: Slug;
  parts: PartMeta[];
  /** 섹션 id → 전체 개수 (글자표는 글자 수) */
  counts: Record<string, number>;
  /** 단계 전체 표현 수 (글자표 제외) */
  total: number;
}

/** 주제 페이지: 그 섹션 데이터만 */
export interface TopicPayload {
  stage: Pick<Stage, "id" | "name" | "short" | "desc">;
  slug: Slug;
  section: Section;
  count: number;
  parts: PartMeta[];
  charts: Charts;
}
