/* 문제 자동 생성 (v2.2): 섹션 데이터로 4지선다 문제를 만든다
   - 순수 함수만 둔다 (난수 rng 주입) → node --test로 단위 테스트
   - 값 import 없이 type만 쓴다 (클라이언트 번들에 데이터가 들어가지 않게) */
import type { Section, TableCell } from "@data";

export type QLang = "ja" | "zh" | "en";
export type QType = "meaning" | "foreign" | "listen" | "cloze" | "part5";

export interface Face { text: string; sub: string; pron: string }
export interface QItem { ko: string; ja: Face; zh: Face; en: Face }

export interface Question {
  /** 오답 노트 key: 섹션:항목:유형:언어 */
  id: string;
  type: QType;
  lang: QLang;
  item: number;
  /** 문제로 보여 줄 문장 (cloze는 빈칸이 들어간 문장) */
  prompt: string;
  choices: string[];
  answer: number;
  /** 정답 확인 때 보여 줄 원래 항목 (part5는 정답을 채운 문장) */
  source: QItem;
  /** part5 해설 */
  explanation?: string;
}

export type Rng = () => number;

const face = (text: string, sub: string, pron: string): Face => ({ text, sub, pron });

/** 섹션 type별 항목을 같은 모양(QItem)으로 맞춘다 */
export const toQItems = (sec: Section): QItem[] => {
  switch(sec.type){
    case "list": case "card": case "concept":
      return sec.items.map(([ko, [ja, kana, jp], [zh, py, zp], [en, ep]]) =>
        ({ ko, ja: face(ja, kana, jp), zh: face(zh, py, zp), en: face(en, "", ep) }));
    case "dialog":
      return sec.items.map(([, ko, [ja, jp], [zh, py, zp], [en, ep]]) =>
        ({ ko, ja: face(ja, "", jp), zh: face(zh, py, zp), en: face(en, "", ep) }));
    case "pattern":
      return sec.items.map(([, ko, [ja, jp], [zh, py, zp], [en, ep]]) =>
        ({ ko, ja: face(ja, "", jp), zh: face(zh, py, zp), en: face(en, "", ep) }));
    case "toeic":
      // TOEIC 탭은 영어만: 일본어·중국어 칸은 비워 둔다 (출제 언어는 en으로 고정)
      return sec.items.map(([en, ep, ko]) => ({ ko, ja: face("", "", ""), zh: face("", "", ""), en: face(en, "", ep) }));
    case "problems":
      // 정답을 채운 문장을 원문으로, 문법 포인트를 뜻 자리에
      return sec.items.map(([stem, choices, ans, , point]) =>
        ({ ko: point, ja: face("", "", ""), zh: face("", "", ""), en: face(stem.replace(/_{5,}/, choices[ans]), "", "") }));
    default:
      return [];
  }
};

/** 문제를 낼 수 있는 섹션: 보기 4개를 만들 만큼 서로 다른 항목이 있어야 한다 */
export const quizzable = (sec: Section) =>
  sec.type === "problems" ? sec.items.length >= 1 : new Set(toQItems(sec).map(i => i.ko)).size >= 4;

/** 영어만 다루는 섹션 (TOEIC 탭): 공부할 언어 설정과 상관없이 영어로 출제 */
export const englishOnly = (sec: Section) => sec.type === "toeic" || sec.type === "problems";

const shuffle = <T,>(arr: T[], rng: Rng) => {
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const pick = <T,>(arr: readonly T[], rng: Rng) => arr[Math.floor(rng() * arr.length)];

/** 정답 + 서로 다른 오답 최대 3개 → 섞은 보기와 정답 위치 */
const makeChoices = (answer: string, pool: string[], rng: Rng) => {
  const wrong = shuffle([...new Set(pool.filter(p => p && p !== answer))], rng).slice(0, 3);
  const choices = shuffle([answer, ...wrong], rng);
  return { choices, answer: choices.indexOf(answer) };
};

/* ───────── 빈칸 채우기: 개념 표의 언어 칸(문법 요소)이 예문에 들어 있으면 그 부분을 비운다 ───────── */
const HANGUL = /[가-힣]/;
const cellText = (c: TableCell) => (Array.isArray(c) ? c[0] : c);
/** 표 한 열의 문법 요소 후보 (한글 설명, A/B 자리표, 기호는 제외) */
export const markersOf = (sec: Section, lang: QLang): string[] => {
  if(sec.type !== "concept" || !sec.head || !sec.rows) return [];
  const col = sec.head.indexOf(lang === "ja" ? "日本語" : lang === "zh" ? "中文" : "English");
  if(col < 0) return [];
  const out = new Set<string>();
  for(const r of sec.rows){
    for(const raw of cellText(r[col] ?? "").split(/\s*\/\s*|\s*,\s*|、/)){
      const t = raw.replace(/\(.*?\)|（.*?）/g, "").replace(/[~～…]/g, "").trim();
      if(!t || HANGUL.test(t) || /^[AB]$/.test(t) || /[+]/.test(t) || /\b[AB]\b/.test(t)) continue;
      out.add(t);
    }
  }
  return [...out];
};

const contains = (sentence: string, token: string, lang: QLang) =>
  lang === "en" ? new RegExp(`(^|[^A-Za-z'])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z']|$)`, "i").test(sentence) : sentence.includes(token);

export const BLANK = "＿＿＿";

/** 예문 하나로 빈칸 문제를 만들 수 있으면 { prompt, answer, pool } */
export const clozeFor = (sentence: string, markers: string[], lang: QLang) => {
  const hits = markers.filter(m => contains(sentence, m, lang)).sort((a, b) => b.length - a.length);
  if(!hits.length) return null;
  const answer = hits[0];
  // 문장에 들어 있지 않은 요소만 오답으로 (정답이 두 개처럼 보이지 않게)
  const pool = markers.filter(m => m !== answer && !contains(sentence, m, lang) && !m.includes(answer) && !answer.includes(m));
  if(pool.length < 2) return null;
  const prompt = lang === "en"
    ? sentence.replace(new RegExp(`(^|[^A-Za-z'])${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^A-Za-z']|$)`, "i"), `$1${BLANK}`)
    : sentence.replace(answer, BLANK);
  return { prompt, answer, pool };
};

export interface BuildOptions {
  langs: QLang[];
  tts: boolean;
  count?: number;
  /** 오답 다시 풀기: 이 id들만 출제 */
  only?: string[];
  rng?: Rng;
}

const textOf = (it: QItem, l: QLang) => it[l].text;

/** 한 문제 만들기 (유형과 언어가 정해진 상태) */
export const makeQuestion = (sec: Section, items: QItem[], i: number, type: QType, lang: QLang, rng: Rng): Question | null => {
  const it = items[i];
  const id = `${sec.id}:${i}:${type}:${lang}`;
  if(type === "part5"){
    if(sec.type !== "problems" || !sec.items[i]) return null;
    const [stem, choices, ans, exp] = sec.items[i];
    // 보기 순서는 원래대로 (A~D 해설과 맞추기 위해)
    return { id, type, lang: "en", item: i, prompt: stem.replace(/_{5,}/, BLANK), choices: [...choices], answer: ans, source: it, explanation: exp };
  }
  if(type === "cloze" && sec.type === "problems") return null;
  const others = items.filter((_, j) => j !== i);
  if(type === "meaning" || type === "listen"){
    const c = makeChoices(it.ko, others.map(o => o.ko), rng);
    if(c.choices.length < 2) return null;
    return { id, type, lang, item: i, prompt: textOf(it, lang), ...c, source: it };
  }
  if(type === "foreign"){
    const c = makeChoices(textOf(it, lang), others.map(o => textOf(o, lang)), rng);
    if(c.choices.length < 2) return null;
    return { id, type, lang, item: i, prompt: it.ko, ...c, source: it };
  }
  const cz = clozeFor(textOf(it, lang), markersOf(sec, lang), lang);
  if(!cz) return null;
  const c = makeChoices(cz.answer, cz.pool, rng);
  return { id, type, lang, item: i, prompt: cz.prompt, ...c, source: it };
};

/** 섹션 문제 세트 만들기 */
export const buildQuiz = (sec: Section, opt: BuildOptions): Question[] => {
  const rng = opt.rng ?? Math.random;
  const items = toQItems(sec);
  if(!items.length || !opt.langs.length) return [];

  if(opt.only){
    return opt.only.map(id => {
      const [secId, i, type, lang] = id.split(":");
      if(secId !== sec.id || !items[Number(i)] || !opt.langs.includes(lang as QLang)) return null;
      return makeQuestion(sec, items, Number(i), type as QType, lang as QLang, rng);
    }).filter((q): q is Question => !!q);
  }

  const count = Math.min(opt.count ?? 10, items.length);
  if(sec.type === "problems"){
    return shuffle(items.map((_, j) => j), rng).slice(0, count)
      .map(i => makeQuestion(sec, items, i, "part5", "en", rng)).filter((q): q is Question => !!q);
  }
  const types: QType[] = ["meaning", "foreign", ...(opt.tts ? ["listen" as const] : [])];
  const out: Question[] = [];
  for(const i of shuffle(items.map((_, j) => j), rng)){
    if(out.length >= count) break;
    const lang = pick(opt.langs, rng);
    // 개념 섹션은 빈칸 문제를 먼저 시도하고, 못 만들면 다른 유형으로
    const tryTypes: QType[] = sec.type === "concept" && rng() < 0.6 ? ["cloze", pick(types, rng)] : [pick(types, rng)];
    for(const t of tryTypes){
      const q = makeQuestion(sec, items, i, t, lang, rng);
      if(q){ out.push(q); break; }
    }
  }
  return out;
};

/* ───────── 오답 노트 (localStorage "tri.wrong": 문제 id 배열) ───────── */
export const WRONG_KEY = "tri.wrong";
export const readWrong = (get: (k: string) => string | null): string[] => {
  try{ return JSON.parse(get(WRONG_KEY) || "[]"); }catch{ return []; }
};
export const updateWrong = (list: string[], id: string, correct: boolean) =>
  correct ? list.filter(x => x !== id) : list.includes(id) ? list : [...list, id];
