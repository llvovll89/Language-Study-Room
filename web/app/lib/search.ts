import { plainPinyin, plainPron } from "@lib/pron.mjs";
import type { EnField, JaShort, Section, TableCell, ZhField } from "@data";

/* 검색 키: 기존 build.mjs의 textKey/langKey와 같은 규칙 (표기 기호 제거, 병음은 성조 없는 형태 포함) */
const key = (parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ").toLowerCase();

const langParts = (ja: string, kana: string, jp: string, [zh, py, zp]: ZhField, [en, ep]: EnField) =>
  [ja, kana, plainPron(jp || "", "ja"), zh, py && plainPinyin(py), plainPron(zp || "", "zh"), en, plainPron(ep || "", "en")];

const cellText = (c: TableCell) => (Array.isArray(c) ? c[0] : c);

/** 섹션 안 항목별 검색 키 (표 행 → 예문 순서, 렌더링 순서와 같다) */
export const sectionKeys = (sec: Section): string[] => {
  switch(sec.type){
    case "list":
    case "card":
      return sec.items.map(([ko, [ja, kana, jp], zh, en]) => key([ko, ...langParts(ja, kana, jp, zh, en)]));
    case "dialog":
      return sec.items.map(([who, ko, [ja, jp], zh, en]) => key([who, ko, ...langParts(ja, "", jp, zh, en)]));
    case "pattern":
      return sec.items.map(([tags, ko, [ja, jp], zh, en]: [string[], string, JaShort, ZhField, EnField]) =>
        key([...tags, ko, ...langParts(ja, "", jp, zh, en)]));
    case "toeic":
      return sec.items.map(([en, ep, ko, exEn, exKo]) => key([en, plainPron(ep || "", "en"), ko, exEn, exKo]));
    case "problems":
      return sec.items.map(([stem, choices, , exp, point]) => key([stem, ...choices, exp, point]));
    case "table":
      return sec.rows.map(r => key(r.map(cellText)));
    case "concept":
      return [
        ...(sec.rows || []).map(r => key(r.map(cellText))),
        ...sec.items.map(([ko, [ja, kana, jp], zh, en]) => key([ko, ...langParts(ja, kana, jp, zh, en)])),
      ];
    default:
      return [];
  }
};

export const matches = (k: string, q: string) => !q || k.includes(q);
