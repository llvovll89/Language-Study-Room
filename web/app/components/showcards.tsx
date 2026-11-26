import { useEffect, useRef, useState } from "react";
import type { CardSection, ListItem } from "@data";
import { speak } from "~/lib/speech";
import { HTML_LANG, LANG_LABEL, TTS_LANG, type Foreign } from "~/lib/stages";
import { getStore, useSettings } from "~/state/settings";
import { Pron } from "./cells";

/* 보여 주기 카드 (여행 탭)
   - JS 없이도 카드 내용은 모두 보인다 (prerender)
   - "보여 주기"를 누르면 고른 언어 문장을 화면 가득 큰 글씨로 띄운다 (<dialog>)
   - 마지막으로 고른 언어를 기억한다 (localStorage tri.showLang) */

type Visible = boolean[] | undefined;

const textOf = (it: ListItem, l: Foreign) => (l === "ja" ? it[1][0] : l === "zh" ? it[2][0] : it[3][0]);
const subOf = (it: ListItem, l: Foreign) => (l === "ja" ? it[1][1] : l === "zh" ? it[2][1] : "");
const pronOf = (it: ListItem, l: Foreign) => (l === "ja" ? it[1][2] : l === "zh" ? it[2][2] : it[3][1]);
const FONT: Record<Foreign, string> = { ja: "font-mincho", zh: "font-hanzi", en: "font-sans" };

function ShowDialog({ item, onClose }: { item: ListItem | null; onClose: () => void }){
  const ref = useRef<HTMLDialogElement>(null);
  const { show, showPron, tts } = useSettings();
  const langs = (["ja", "zh", "en"] as const).filter(l => show[l]);
  const [lang, setLang] = useState<Foreign>("ja");

  useEffect(() => {
    const saved = getStore.get("tri.showLang") as Foreign | null;
    if(saved && langs.includes(saved)) setLang(saved);
    else if(langs.length) setLang(langs[0]);
  }, [langs.join(",")]);

  useEffect(() => {
    const d = ref.current;
    if(!d) return;
    if(item && !d.open) d.showModal();
    if(!item && d.open) d.close();
  }, [item]);

  const pick = (l: Foreign) => { setLang(l); getStore.set("tri.showLang", l); };

  return (
    <dialog ref={ref} onClose={onClose} aria-label="보여 주기"
      className="show-dialog m-0 p-0 w-full h-full max-w-none max-h-none bg-paper text-ink backdrop:bg-black/60">
      {item && (
        <div className="h-full flex flex-col px-5 md:px-12 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <div role="radiogroup" aria-label="보여 줄 언어" className="inline-flex bg-sheet border border-line rounded-full p-0.5 gap-0.5">
              {langs.map(l => (
                <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => pick(l)}
                  className={`rounded-full px-4 min-h-10 text-sm font-medium ${lang === l ? "text-white" : "text-muted"}`}
                  style={lang === l ? { background: `var(--${l})` } : undefined}>{LANG_LABEL[l]}</button>
              ))}
            </div>
            <button type="button" onClick={onClose} aria-label="닫기"
              className="ml-auto size-11 rounded-full border border-line bg-sheet grid place-items-center text-xl text-ink-2">✕</button>
          </div>
          <div className={`${lang} flex-1 flex flex-col justify-center py-6 min-h-0`}>
            <p lang={HTML_LANG[lang]} className={`show-text m-0 ${FONT[lang]} font-bold leading-[1.35] break-keep text-[clamp(34px,8.5vw,84px)]`} style={{ overflowWrap: "anywhere" }}>
              {textOf(item, lang)}
            </p>
            {showPron && subOf(item, lang) && <p className="m-0 mt-4 text-lg md:text-2xl text-muted" lang={lang === "zh" ? "zh-Latn-pinyin" : "ja"}>{subOf(item, lang)}</p>}
            {showPron && <Pron text={pronOf(item, lang)} lang={lang} className="!text-lg md:!text-2xl !mt-2" />}
          </div>
          <div className="flex items-end gap-3 border-t border-line pt-4">
            <p className="m-0 flex-1 text-base text-ink-2"><span className="text-xs font-bold text-ko block">한국어</span>{item[0]}</p>
            {tts && (
              <button type="button" onClick={() => speak(lang === "ja" ? item[1][1] || item[1][0] : textOf(item, lang), TTS_LANG[lang])}
                className="rounded-full bg-ink text-paper px-5 min-h-12 font-medium">🔊 들려주기</button>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

export function CardBody({ sec, visible }: { sec: CardSection; visible: Visible }){
  const { show, ready } = useSettings();
  const [open, setOpen] = useState<ListItem | null>(null);
  const langs = (["ja", "zh", "en"] as const).filter(l => show[l]);
  return (
    <>
      <div className="cards grid gap-3 md:grid-cols-2 mb-5">
        {sec.items.map((it, i) => (!visible || visible[i]) && (
          <article key={i} data-item className="show-card bg-raised border border-line rounded-xl p-4 flex flex-col gap-2">
            <p className="m-0 font-bold text-[17px] leading-snug">{it[0]}</p>
            <ul className="m-0 p-0 list-none space-y-0.5 text-[15px] text-ink-2">
              {langs.map(l => (
                <li key={l} className={`${l} flex gap-2`}>
                  <span className="text-[11px] font-bold w-12 flex-none pt-1" style={{ color: `var(--${l})` }}>{LANG_LABEL[l]}</span>
                  <span lang={HTML_LANG[l]} className={FONT[l]}>{textOf(it, l)}</span>
                </li>
              ))}
            </ul>
            {ready && (
              <button type="button" onClick={() => setOpen(it)} className="show-btn self-start mt-1 rounded-full bg-ink text-paper px-4 min-h-10 text-sm font-medium">
                크게 보여 주기
              </button>
            )}
          </article>
        ))}
      </div>
      <ShowDialog item={open} onClose={() => setOpen(null)} />
    </>
  );
}
