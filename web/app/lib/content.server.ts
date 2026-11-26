/* 콘텐츠 원본(data/)은 route loader에서만 읽는다 (.server 모듈은 클라이언트 번들에 포함되지 않음)
   prerender 때 loader가 실행되어 각 페이지 HTML과 .data에 그 단계 데이터만 들어간다 */
import { DAKUON, PINYIN, SEION, STAGES, TOEIC, TRAVEL, YOON, type Section } from "@data";
import { SLUGS } from "./stages";
import { isChart, isConcept, type Charts, type StageMeta, type StagePayload } from "./sections";

const KANA_TOTAL = SEION.filter(Boolean).length + DAKUON.length + YOON.length;
const PINYIN_TOTAL = PINYIN.tones.length + PINYIN.initials.length + PINYIN.finals.length;

const countOf = (s: Section) =>
  s.type === "kana" ? KANA_TOTAL : s.type === "pinyin" ? PINYIN_TOTAL :
  ("rows" in s && s.rows ? s.rows.length : 0) + ("items" in s ? s.items.length : 0);

/* 학습 단계 1~3 + 여행 탭 + TOEIC 탭 */
const ALL = [...STAGES, TRAVEL, TOEIC];

/** 모든 페이지가 쓰는 단계 요약 (탭, 홈 카드) */
export const stageMetas = (): StageMeta[] => ALL.map((st, i) => ({
  id: st.id, slug: SLUGS[i], name: st.name, short: st.short, desc: st.desc,
  sections: st.sections.length,
  concepts: st.sections.filter(isConcept).length,
  items: st.sections.reduce((n, s) => n + (isChart(s) ? 0 : countOf(s)), 0),
}));

/** 한 단계 페이지에 필요한 데이터만 */
export const stagePayload = (slug: string | undefined): StagePayload | null => {
  const i = SLUGS.indexOf(slug as (typeof SLUGS)[number]);
  if(i < 0) return null;
  const stage = ALL[i];
  const has = (t: string) => stage.sections.some(s => s.type === t);
  const charts: Charts = {
    kana: has("kana") ? { seion: SEION, dakuon: DAKUON, yoon: YOON } : null,
    pinyin: has("pinyin") ? PINYIN : null,
  };
  return {
    stage,
    counts: Object.fromEntries(stage.sections.map(s => [s.id, countOf(s)])),
    total: stageMetas()[i].items,
    charts,
  };
};
