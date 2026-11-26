import { useState, type ReactNode } from "react";
import { tokenizePron, type PronNode } from "@lib/pron.mjs";
import type { EnField, JaField, ZhField } from "@data";
import { speak } from "~/lib/speech";
import { LANG_LABEL, TTS_LANG, type Foreign, type LangCode } from "~/lib/stages";
import { useSettings } from "~/state/settings";

/* 반복 요소는 app.css의 짧은 class(.cell, .txt, .pron …)를 쓴다 */

/* ───────── 한글 발음 표기 (HTML 문자열 없이 토큰 → element) ───────── */
const PronNodes = ({ nodes }: { nodes: PronNode[] }) => (
  <>
    {nodes.map((n, i) =>
      n.t === "text" ? n.v :
      n.t === "tone" ? <sup key={i} className={`tone t${n.d}`} title={n.name}>{n.mark}</sup> :
      n.t === "link" ? <span key={i} className="link" aria-hidden="true">‿</span> :
      n.t === "pause" ? <span key={i} className="pause" aria-hidden="true" /> :
      <span key={i} className={n.t}><PronNodes nodes={n.c} /></span>)}
  </>
);

/** lang class가 있는 요소 안에서는 그 언어 색을 따른다 */
export const Pron = ({ text, lang, className = "" }: { text: string; lang: Foreign; className?: string }) =>
  text ? <span className={`pron${className ? " " + className : ""}`}><PronNodes nodes={tokenizePron(text, lang)} /></span> : null;

/* ───────── 발음 듣기 버튼 ───────── */
const SAY_LABEL: Record<Foreign, string> = { ja: "일본어 발음 듣기", zh: "중국어 발음 듣기", en: "영어 발음 듣기" };
export const Say = ({ text, lang }: { text: string; lang: Foreign }) => {
  const { tts } = useSettings();
  if(!tts) return null;
  return (
    <button type="button" className="say" data-say={text} data-lang={TTS_LANG[lang]} aria-label={SAY_LABEL[lang]}
      onClick={e => { e.stopPropagation(); speak(text, TTS_LANG[lang]); }}>
      <span className="say-icon" />
    </button>
  );
};

/* ───────── 칸 공통: 가리기와 누르면 그 칸만 보기 ───────── */
function Cell({ lang, children }: { lang: LangCode; children: (b: string) => ReactNode }){
  const { hide } = useSettings();
  const hidable = hide[lang];
  const [shown, setShown] = useState(false);
  // 가리기 설정이 바뀌면 열어 둔 칸을 다시 닫는다 (칸이 1,000개 이상이라 effect 대신 렌더 중에 맞춘다)
  const [prev, setPrev] = useState(hidable);
  if(prev !== hidable){ setPrev(hidable); setShown(false); }
  return (
    <div className={`cell ${lang}${hidable ? " hidable" : ""}${shown ? " shown" : ""}`} data-l={LANG_LABEL[lang]}
      onClick={hidable ? () => setShown(s => !s) : undefined}>
      {children(hidable && !shown ? " blurred" : "")}
    </div>
  );
}

export const KoCell = ({ ko }: { ko: string }) => <Cell lang="ko">{b => <span className={`txt${b}`}>{ko}</span>}</Cell>;

/* ruby는 줄바꿈이 안 되므로 짧은 단어에만 쓰고, 문장은 읽기를 따로 한 줄로 (기존 HTML과 같은 규칙) */
const RUBY_MAX = 6;
export const JaCell = ({ ja: [ja, kana, pron] }: { ja: JaField }) => {
  const { showPron } = useSettings();
  const ruby = !!kana && ja.length <= RUBY_MAX && !/[。、？！?!]/.test(ja);
  return (
    <Cell lang="ja">{b => <>
      <div className="row">
        <span lang="ja" className={`txt${b}`}>{ruby ? <ruby>{ja}{showPron && <rt>{kana}</rt>}</ruby> : ja}</span>
        <Say text={kana || ja} lang="ja" />
      </div>
      {showPron && kana && !ruby && <span lang="ja" className={`yomi${b}`}>{kana}</span>}
      {showPron && <Pron text={pron} lang="ja" className={b.trim()} />}
    </>}</Cell>
  );
};

export const ZhCell = ({ zh: [zh, py, pron] }: { zh: ZhField }) => {
  const { showPron } = useSettings();
  return (
    <Cell lang="zh">{b => <>
      <div className="row">
        <span lang="zh-CN" className={`txt${b}`}>{zh}</span>
        <Say text={zh} lang="zh" />
      </div>
      {showPron && py && <span lang="zh-Latn-pinyin" className={`py${b}`}>{py}</span>}
      {showPron && <Pron text={pron} lang="zh" className={b.trim()} />}
    </>}</Cell>
  );
};

export const EnCell = ({ en: [en, pron] }: { en: EnField }) => {
  const { showPron } = useSettings();
  return (
    <Cell lang="en">{b => <>
      <div className="row">
        <span lang="en" className={`txt${b}`}>{en}</span>
        <Say text={en} lang="en" />
      </div>
      {showPron && <Pron text={pron} lang="en" className={b.trim()} />}
    </>}</Cell>
  );
};

/** 켜진 외국어 칸만 그린다 */
export const LangCells = ({ ja, zh, en }: { ja: JaField; zh: ZhField; en: EnField }) => {
  const { show } = useSettings();
  return <>{show.ja && <JaCell ja={ja} />}{show.zh && <ZhCell zh={zh} />}{show.en && <EnCell en={en} />}</>;
};

export const ColHead = ({ dialog = false }: { dialog?: boolean }) => {
  const { show } = useSettings();
  const langs: LangCode[] = ["ko", ...(["ja", "zh", "en"] as const).filter(l => show[l])];
  return (
    <div aria-hidden="true" className={`colhead${dialog ? " dlg" : ""}`}>
      {dialog && <span>화자</span>}
      {langs.map(l => <span key={l} data-c={l} className={l}>{LANG_LABEL[l]}</span>)}
    </div>
  );
};
