/* 콘텐츠 원본(data/)은 route loader에서만 읽는다 (.server 모듈은 클라이언트 번들에 포함되지 않음)
   prerender 때 loader가 실행되어 각 페이지 HTML과 .data에 그 페이지 데이터만 들어간다 */
import { DAKUON, PINYIN, SEION, STAGES, TOEIC, TRAVEL, YOON, type Section, type Stage } from "@data";
import { SLUGS, topicPath, topicSlug, type Slug } from "./topics";
import { isChart, isConcept, kindOf, type Charts, type PartMeta, type StageMeta, type StagePayload, type TopicPayload } from "./sections";

const KANA_TOTAL = SEION.filter(Boolean).length + DAKUON.length + YOON.length;
const PINYIN_TOTAL = PINYIN.tones.length + PINYIN.initials.length + PINYIN.finals.length;

const countOf = (s: Section) =>
  s.type === "kana" ? KANA_TOTAL : s.type === "pinyin" ? PINYIN_TOTAL :
  ("rows" in s && s.rows ? s.rows.length : 0) + ("items" in s ? s.items.length : 0);

/* 학습 단계 1~3 + 여행 탭 + TOEIC 탭 */
const ALL = [...STAGES, TRAVEL, TOEIC];

const itemsOf = (st: Stage) => st.sections.reduce((n, s) => n + (isChart(s) ? 0 : countOf(s)), 0);

/** 모든 페이지가 쓰는 단계 요약 (탭, 홈 카드) */
export const stageMetas = (): StageMeta[] => ALL.map((st, i) => ({
  id: st.id, slug: SLUGS[i], name: st.name, short: st.short, desc: st.desc,
  sections: st.sections.length,
  concepts: st.sections.filter(isConcept).length,
  items: itemsOf(st),
}));

/** 주제 묶음: parts[i].from부터 다음 묶음 전까지 */
const partsOf = (st: Stage, slug: Slug): PartMeta[] => {
  const starts = st.parts.map(p => st.sections.findIndex(s => s.id === p.from));
  return st.parts.map((p, i) => ({
    title: p.title, desc: p.desc,
    topics: st.sections.slice(starts[i], starts[i + 1] ?? st.sections.length).map(s => ({
      id: s.id, path: topicPath(slug, s.id), title: s.title, kind: kindOf(s), count: countOf(s), chart: isChart(s),
      ...(s.type === "kana" ? { lang: "ja" as const } : s.type === "pinyin" ? { lang: "zh" as const } : {}),
    })),
  }));
};

const find = (slug: string | undefined) => {
  const i = SLUGS.indexOf(slug as Slug);
  return i < 0 ? null : { stage: ALL[i], slug: SLUGS[i] };
};

/** 단계 페이지: 주제 목록과 단계 전체 검색에 쓰는 섹션 데이터 */
export const stagePayload = (slug: string | undefined): StagePayload | null => {
  const f = find(slug);
  if(!f) return null;
  return {
    stage: f.stage,
    slug: f.slug,
    parts: partsOf(f.stage, f.slug),
    counts: Object.fromEntries(f.stage.sections.map(s => [s.id, countOf(s)])),
    total: itemsOf(f.stage),
  };
};

/** 주제 페이지: 그 섹션과 (글자표면) 글자 데이터만 */
export const topicPayload = (slug: string | undefined, topic: string | undefined): TopicPayload | null => {
  const f = find(slug);
  const section = f?.stage.sections.find(s => topicSlug(s.id) === topic);
  if(!f || !section) return null;
  const charts: Charts = {
    kana: section.type === "kana" ? { seion: SEION, dakuon: DAKUON, yoon: YOON } : null,
    pinyin: section.type === "pinyin" ? PINYIN : null,
  };
  const { id, name, short, desc } = f.stage;
  return { stage: { id, name, short, desc }, slug: f.slug, section, count: countOf(section), parts: partsOf(f.stage, f.slug), charts };
};
