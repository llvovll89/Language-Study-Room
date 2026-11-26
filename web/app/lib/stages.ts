import { STAGES, type Stage } from "@data";

/* URL 슬러그 ↔ 단계 */
export const SLUGS = ["basic", "intermediate", "advanced"] as const;
export type Slug = (typeof SLUGS)[number];

export const stageBySlug = (slug: string | undefined): Stage | undefined => {
  const i = SLUGS.indexOf(slug as Slug);
  return i < 0 ? undefined : STAGES[i];
};
export const slugOf = (stage: Stage): Slug => SLUGS[stage.id - 1];

export type LangCode = "ko" | "ja" | "zh" | "en";
export const FOREIGN = ["ja", "zh", "en"] as const;
export type Foreign = (typeof FOREIGN)[number];
export const LANG_LABEL: Record<LangCode, string> = { ko: "한국어", ja: "日本語", zh: "中文", en: "English" };
export const HTML_LANG: Record<LangCode, string> = { ko: "ko", ja: "ja", zh: "zh-CN", en: "en" };
export const TTS_LANG: Record<Foreign, string> = { ja: "ja-JP", zh: "zh-CN", en: "en-US" };

/* 언어 전용 섹션: 해당 언어를 끄면 섹션도 숨긴다 */
export const SECTION_LANG: Partial<Record<string, Foreign>> = { kana: "ja", pinyin: "zh" };
