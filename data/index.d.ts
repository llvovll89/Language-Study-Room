/* data/index.js 타입 정의 (web 앱이 사용. 형식 설명은 index.js 주석 참고) */

/** [일본어, 가나 읽기, 한글 발음] */
export type JaField = [ja: string, kana: string, pron: string];
/** dialog·pattern의 일본어: [일본어, 한글 발음] */
export type JaShort = [ja: string, pron: string];
/** [중국어, 병음, 한글 발음] */
export type ZhField = [zh: string, pinyin: string, pron: string];
/** [영어, 한글 발음] */
export type EnField = [en: string, pron: string];

export type ListItem = [ko: string, ja: JaField, zh: ZhField, en: EnField];
export type DialogItem = [who: string, ko: string, ja: JaShort, zh: ZhField, en: EnField];
export type PatternItem = [tags: [ko: string, ja: string, zh: string, en: string], ko: string, ja: JaShort, zh: ZhField, en: EnField];
/** 표 칸: 문자열 또는 [텍스트, 한글 발음] */
export type TableCell = string | [text: string, pron: string];

interface SectionBase {
  id: string;
  title: string;
  /** "日本語 / 中文 / English" */
  sub: string;
  note?: string[];
  /** table 섹션에 붙이면 "개념" 표시 */
  concept?: boolean;
}
export interface ListSection extends SectionBase { type: "list"; items: ListItem[] }
export interface DialogSection extends SectionBase { type: "dialog"; items: DialogItem[] }
export interface PatternSection extends SectionBase { type: "pattern"; items: PatternItem[] }
export interface TableSection extends SectionBase { type: "table"; head: string[]; rows: TableCell[][] }
export interface ConceptSection extends SectionBase { type: "concept"; head?: string[]; rows?: TableCell[][]; items: ListItem[] }
export interface CardSection extends SectionBase { type: "card"; items: ListItem[] }
/** [영어, 한글 발음, 한국어 뜻, 영어 예문, 예문 뜻] */
export type ToeicItem = [en: string, enPron: string, ko: string, exEn: string, exKo: string];
/** [문제(빈칸 "_____"), 보기 4개, 정답 index, 해설, 문법 포인트] */
export type Problem = [stem: string, choices: [string, string, string, string], answer: 0 | 1 | 2 | 3, explanation: string, point: string];
export interface ToeicSection extends SectionBase { type: "toeic"; items: ToeicItem[] }
export interface ProblemSection extends SectionBase { type: "problems"; items: Problem[] }
export interface KanaSection extends SectionBase { type: "kana" }
export interface PinyinSection extends SectionBase { type: "pinyin" }
export type Section = ListSection | DialogSection | PatternSection | TableSection | ConceptSection | CardSection | ToeicSection | ProblemSection | KanaSection | PinyinSection;

/** 단계 페이지의 주제 묶음: from 섹션부터 다음 묶음 전까지 (웹앱 전용) */
export interface Part {
  title: string;
  desc?: string;
  /** 묶음의 첫 섹션 id */
  from: string;
}

export interface Stage {
  /** 1~3: 학습 단계, 4: 여행, 5: TOEIC */
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  short: string;
  desc: string;
  /** 주제 묶음 (첫 묶음은 첫 섹션부터, 순서대로) */
  parts: Part[];
  sections: Section[];
}

/** [히라가나, 로마자, 한글] (null은 빈 칸) */
export type Kana = [hira: string, romaji: string, ko: string];
export interface Pinyin {
  /** [예시 한자, 병음, 성조 번호, 한글 발음, 설명] */
  tones: [ch: string, py: string, tone: 0 | 1 | 2 | 3 | 4, pron: string, desc: string][];
  /** [성모·운모, 한글 소리, 예시 한자, 예시 병음] */
  initials: [py: string, ko: string, ch: string, chPy: string][];
  finals: [py: string, ko: string, ch: string, chPy: string][];
}

export declare const STAGES: Stage[];
export declare const TRAVEL: Stage;
export declare const TOEIC: Stage;
export declare const SEION: (Kana | null)[];
export declare const DAKUON: Kana[];
export declare const YOON: Kana[];
export declare const PINYIN: Pinyin;
