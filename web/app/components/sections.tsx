import { createContext, useContext, useState } from "react";
import { Link } from "react-router";
import type { ConceptSection, DialogSection, Kana, ListSection, PatternSection, Section as SectionT, TableCell, TableSection } from "@data";
import { speak } from "~/lib/speech";
import { isChart, isConcept, type Charts } from "~/lib/sections";
import { HTML_LANG, LANG_LABEL, type Foreign, type LangCode } from "~/lib/stages";
import { useSettings } from "~/state/settings";
import { ColHead, KoCell, LangCells, Pron } from "./cells";
import { QuizLauncher } from "./quiz";
import { CardBody } from "./showcards";
import { ProblemBody, ToeicBody } from "./toeic";

/* 검색 결과: 항목 index별 표시 여부 (undefined면 전부 표시) */
type Visible = boolean[] | undefined;
const vis = (v: Visible, i: number) => !v || v[i];

/* ───────── list / dialog / pattern ───────── */
const ListBody = ({ sec, visible, offset = 0 }: { sec: ListSection | ConceptSection; visible: Visible; offset?: number }) => (
  <>
    <ColHead />
    {sec.items.map(([ko, ja, zh, en], i) => vis(visible, i + offset) && (
      <div key={i} data-item className="entry">
        <KoCell ko={ko} /><LangCells ja={ja} zh={zh} en={en} />
      </div>
    ))}
  </>
);

const DialogBody = ({ sec, visible }: { sec: DialogSection; visible: Visible }) => (
  <>
    <ColHead dialog />
    {sec.items.map(([who, ko, [ja, jp], zh, en], i) => vis(visible, i) && (
      <div key={i} data-item className={`entry dlg${who === "나" ? " me" : ""}`}>
        <span className="who">{who}</span>
        <KoCell ko={ko} /><LangCells ja={[ja, "", jp]} zh={zh} en={en} />
      </div>
    ))}
  </>
);

const PatternBody = ({ sec, visible }: { sec: PatternSection; visible: Visible }) => {
  const { show } = useSettings();
  return <>{sec.items.map(([tags, ko, [ja, jp], zh, en], i) => vis(visible, i) && (
    <div key={i} data-item className="pat py-5 border-t border-line">
      <div className="flex flex-wrap gap-2 mb-3.5">
        {(["ko", "ja", "zh", "en"] as const).map((l, j) => (l === "ko" || show[l]) && (
          <span key={l} lang={HTML_LANG[l]} className={`tag ${l}`}>{tags[j]}</span>
        ))}
      </div>
      <div className="entry"><KoCell ko={ko} /><LangCells ja={[ja, "", jp]} zh={zh} en={en} /></div>
    </div>
  ))}</>;
};

/* ───────── 표 (table, concept) ───────── */
const colLang = (h: string): LangCode | "" =>
  h === "한국어" ? "ko" : /日本語|기본형|존경어|겸양어/.test(h) ? "ja" : h === "中文" ? "zh" : h === "English" ? "en" : "";

const DataTable = ({ head, rows, visible }: { head: string[]; rows: TableCell[][]; visible: Visible }) => {
  const { show, showPron } = useSettings();
  const langs = head.map(colLang);
  const on = (i: number) => { const l = langs[i]; return !l || l === "ko" || show[l]; };
  return (
    <div className="tbl">
      <table>
        <thead>
          <tr>{head.map((h, i) => on(i) && <th key={i} scope="col" className={langs[i] || undefined}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => vis(visible, ri) && (
            <tr key={ri} data-item>
              {r.map((c, i) => {
                if(!on(i)) return null;
                const [txt, pron] = Array.isArray(c) ? c : [c, ""];
                const l = langs[i];
                return (
                  <td key={i} lang={l ? HTML_LANG[l] : undefined} data-label={head[i]} className={l || undefined}>
                    <span>{txt}{showPron && pron && l && l !== "ko" && <Pron text={pron} lang={l as Foreign} />}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ───────── 가나표 ───────── */
const toKata = (s: string) => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
/* 글자표 데이터는 그 글자표가 있는 단계 loader만 준다 */
export const ChartsContext = createContext<Charts>({ kana: null, pinyin: null });

const KanaChart = () => {
  const { kana } = useContext(ChartsContext);
  const [kata, setKata] = useState(false);
  if(!kana) return null;
  const groups: [string, (Kana | null)[], 3 | 5][] = [
    ["기본 글자 46자 (청음)", kana.seion, 5], ["점과 동그라미가 붙는 글자 (탁음, 반탁음)", kana.dakuon, 5], ["작은 ゃ ゅ ょ 조합 (요음)", kana.yoon, 3],
  ];
  return (
    <>
      <div role="radiogroup" aria-label="글자 종류" className="inline-flex bg-sheet border border-line rounded-full p-0.5 gap-0.5 mb-2">
        {[["ひらがな 히라가나", false], ["カタカナ 가타카나", true]].map(([label, k]) => (
          <button key={String(k)} type="button" role="radio" aria-checked={kata === k} onClick={() => setKata(k as boolean)}
            className={`rounded-full px-4 min-h-[34px] text-sm font-medium ${kata === k ? "bg-ink text-paper" : "text-muted"}`}>{label as string}</button>
        ))}
      </div>
      <div className={`kana-set ${kata ? "kata" : "hira"}`}>
        {groups.map(([h, list, cols]) => (
          <div key={h}>
            <h4 className="mt-6 mb-3 text-[13px] text-muted font-medium">{h}</h4>
            <div className={`grid gap-1.5 md:gap-2 ${cols === 3 ? "grid-cols-3" : "grid-cols-5"}`}>
              {list.map((k, i) => {
                if(!k) return <div key={i} className="invisible" />;
                const ch = kata ? toKata(k[0]) : k[0];
                return (
                  <button key={i} type="button" data-say={k[0]} data-lang="ja-JP" aria-label={`${ch}, ${k[2]}`}
                    onClick={() => speak(k[0], "ja-JP")} className="k k-ja">
                    <b lang="ja" className="font-mincho font-normal text-[clamp(24px,3.4vw,34px)] leading-tight">{ch}</b>
                    <span>{k[2]} {k[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

/* ───────── 병음표 ───────── */
const PyGrid = ({ list }: { list: [string, string, string, string][] }) => (
  <div className="py-grid grid gap-1.5 md:gap-2 grid-cols-[repeat(auto-fill,minmax(96px,1fr))]">
    {list.map(([p, ko, ch, chPy]) => (
      <button key={p} type="button" data-say={ch} data-lang="zh-CN" aria-label={`${p}, ${ko}, 예: ${ch} ${chPy}`}
        onClick={() => speak(ch, "zh-CN")} className="k k-zh">
        <b lang="zh-Latn-pinyin" className="font-medium text-[clamp(20px,2.6vw,26px)] leading-tight">{p}</b>
        <span>{ko}</span>
        <span><i lang="zh-CN" className="not-italic font-hanzi text-sm text-ink-2">{ch}</i> {chPy}</span>
      </button>
    ))}
  </div>
);
const PinyinChart = () => {
  const { pinyin: PINYIN } = useContext(ChartsContext);
  if(!PINYIN) return null;
  return <>
    <h4 className="mt-6 mb-3 text-[13px] text-muted font-medium">성조 4개와 경성 (같은 ma도 높낮이에 따라 뜻이 다릅니다)</h4>
    <div className="tone-grid grid gap-2 grid-cols-[repeat(auto-fill,minmax(120px,1fr))] md:grid-cols-5">
      {PINYIN.tones.map(([ch, py, , pron, desc]) => (
        <button key={ch} type="button" data-say={ch} data-lang="zh-CN" aria-label={`${ch} ${py}, ${desc}`}
          onClick={() => speak(ch, "zh-CN")} className="k k-zh zh px-2 py-3.5">
          <b lang="zh-CN" className="font-hanzi font-normal text-[clamp(24px,3.4vw,34px)] leading-tight">{ch}</b>
          <span lang="zh-Latn-pinyin">{py}</span>
          <Pron text={pron} lang="zh" className="!text-[15px] !m-0" />
          <span className="!whitespace-normal leading-snug mt-1">{desc}</span>
        </button>
      ))}
    </div>
    <h4 className="mt-6 mb-3 text-[13px] text-muted font-medium">성모 (첫소리)</h4><PyGrid list={PINYIN.initials} />
    <h4 className="mt-6 mb-3 text-[13px] text-muted font-medium">운모 (모음 부분)</h4><PyGrid list={PINYIN.finals} />
  </>;
};

/* ───────── 섹션 ───────── */

export const KindBadge = ({ small = false }: { small?: boolean }) => (
  <span className={`kind inline-block shrink-0 whitespace-nowrap align-[.18em] mr-2 font-bold not-italic rounded-full bg-ink text-paper [.on_&]:bg-paper [.on_&]:text-ink ${small ? "text-[10.5px] px-1.5 py-px mr-1.5" : "text-[11.5px] px-2 py-0.5"}`}>개념</span>
);

const BULB = (
  <svg className="size-[18px] flex-none mt-[3px] hidden md:block" style={{ color: "color-mix(in srgb, var(--mark) 70%, var(--ink))" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
  </svg>
);

/** level: 제목 단계 (주제 페이지 1, 단계 검색 결과 2)
    href: 제목을 주제 페이지 링크로 (단계 검색 결과) */
export function Section({ sec, total, visible, query, level = 3, href }: { sec: SectionT; total: number; visible: Visible; query: string; level?: 1 | 2 | 3; href?: string }){
  const H = `h${level}` as const;
  const [jp, zh, en] = sec.sub.split(" / ");
  const n = visible ? visible.filter(Boolean).length : total;
  const tableRows = (sec as TableSection).rows?.length || 0;
  const body =
    sec.type === "kana" ? <KanaChart /> :
    sec.type === "pinyin" ? <PinyinChart /> :
    sec.type === "list" ? <ListBody sec={sec} visible={visible} /> :
    sec.type === "dialog" ? <DialogBody sec={sec} visible={visible} /> :
    sec.type === "pattern" ? <PatternBody sec={sec} visible={visible} /> :
    sec.type === "card" ? <CardBody sec={sec} visible={visible} /> :
    sec.type === "toeic" ? <ToeicBody sec={sec} visible={visible} /> :
    sec.type === "problems" ? <ProblemBody sec={sec} visible={visible} /> :
    sec.type === "concept" ? <>
      {sec.head && sec.rows && <DataTable head={sec.head} rows={sec.rows} visible={visible} />}
      <ListBody sec={sec} visible={visible} offset={tableRows} />
    </> :
    <DataTable head={sec.head} rows={sec.rows} visible={visible} />;
  return (
    <section id={sec.id} data-type={sec.type} data-concept={isConcept(sec) || undefined} aria-labelledby={`${sec.id}-h`}
      className={`sec bg-sheet border ${isConcept(sec) ? "border-line-2" : "border-line"} rounded-[14px] md:rounded-2xl px-4 pt-5 pb-1 md:px-8 md:pt-7 md:pb-3 mb-4 md:mb-6 scroll-mt-20`}>
      <header className="flex justify-between items-start gap-4 mb-4 md:mb-5">
        <div>
          <H id={`${sec.id}-h`} className={`${level === 1 ? "text-[23px] md:text-[28px]" : "text-[19px] md:text-[22px]"} leading-snug font-bold tracking-tight m-0`}>
            {isConcept(sec) && <KindBadge />}
            {href ? <Link to={href} className="underline decoration-line-2 underline-offset-4 hover:decoration-ink">{sec.title}</Link> : sec.title}
          </H>
          <p className="mt-1 text-sm text-muted">
            <span lang="ja" className="font-mincho text-ink-2 mr-2">{jp}</span>
            {zh && <span lang="zh-CN" className="font-hanzi text-ink-2 mr-2">{zh}</span>}{en}
          </p>
        </div>
        <span className="count flex-none text-xs text-muted border border-line rounded-full px-2.5 py-0.5 tabular-nums whitespace-nowrap">
          {isChart(sec) ? `${total}자` : query ? `${n} / ${total}개` : `${total}개`}
        </span>
      </header>
      {sec.note && !query && (
        <div className="note flex gap-3 mb-4 md:mb-6 px-3.5 py-3 md:px-[18px] md:py-3.5 rounded-[10px] text-sm md:text-[14.5px] leading-[1.75] text-ink-2"
          style={{ background: "color-mix(in srgb, var(--mark) 15%, var(--sheet))", border: "1px solid color-mix(in srgb, var(--mark) 35%, transparent)" }}>
          {BULB}
          <ul className="m-0 pl-4 list-disc space-y-1">{sec.note.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
      {body}
      {!query && <QuizLauncher sec={sec} />}
    </section>
  );
}

export { LANG_LABEL };
