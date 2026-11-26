import { useRouteLoaderData } from "react-router";
import type { StageMeta } from "./sections";

/* URL 슬러그 ↔ 단계 (데이터 값은 loader가 준다: content.server.ts) */
export const SLUGS = ["basic", "intermediate", "advanced", "travel"] as const;
export type Slug = (typeof SLUGS)[number];

/** 탭과 제목에 쓰는 이름: 1~3은 "N단계", 여행은 "여행" */
export const TRAVEL_ID = 4;
export const stageLabel = (id: number) => (id === TRAVEL_ID ? "여행" : `${id}단계`);
/** 탭과 머리글의 큰 표시: 숫자 또는 비행기 */
export const stageMark = (id: number) => (id === TRAVEL_ID ? "✈" : String(id));

/** root loader가 주는 단계 요약 (탭, 홈 카드, 이어 보기) */
export const useStages = (): StageMeta[] =>
  (useRouteLoaderData("root") as { stages: StageMeta[] } | undefined)?.stages ?? [];

export type LangCode = "ko" | "ja" | "zh" | "en";
export const FOREIGN = ["ja", "zh", "en"] as const;
export type Foreign = (typeof FOREIGN)[number];
export const LANG_LABEL: Record<LangCode, string> = { ko: "한국어", ja: "日本語", zh: "中文", en: "English" };
export const HTML_LANG: Record<LangCode, string> = { ko: "ko", ja: "ja", zh: "zh-CN", en: "en" };
export const TTS_LANG: Record<Foreign, string> = { ja: "ja-JP", zh: "zh-CN", en: "en-US" };

/* 언어 전용 섹션: 해당 언어를 끄면 섹션도 숨긴다 */
export const SECTION_LANG: Partial<Record<string, Foreign>> = { kana: "ja", pinyin: "zh" };
