import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { canSpeak } from "~/lib/speech";
import { FOREIGN, type Foreign, type LangCode } from "~/lib/stages";

/* 보기 설정: 공부할 언어, 가리기, 발음 표시
   prerender HTML은 기본값으로 그려지고, hydration 뒤 localStorage 값을 적용한다.
   기존 HTML 버전과 같은 key(tri.langs)를 써서 설정을 이어 쓴다 */
interface Settings {
  show: Record<Foreign, boolean>;
  hide: Record<LangCode, boolean>;
  showPron: boolean;
  tts: boolean;
  /** 하이드레이션이 끝나 JS 기능을 쓸 수 있음 */
  ready: boolean;
  toggleShow: (l: Foreign) => void;
  toggleHide: (l: LangCode) => void;
  togglePron: () => void;
}

const ALL_SHOWN: Record<Foreign, boolean> = { ja: true, zh: true, en: true };
const NONE_HIDDEN: Record<LangCode, boolean> = { ko: false, ja: false, zh: false, en: false };

const store = {
  get(k: string){ try{ return localStorage.getItem(k); }catch{ return null; } },
  set(k: string, v: string){ try{ localStorage.setItem(k, v); }catch{ /* 저장 불가 환경은 무시 */ } },
};

const Ctx = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }){
  const [show, setShow] = useState(ALL_SHOWN);
  const [hide, setHide] = useState(NONE_HIDDEN);
  const [showPron, setShowPron] = useState(true);
  const [tts, setTts] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const langs = store.get("tri.langs");
    if(langs !== null){
      const on = langs.split(",");
      setShow({ ja: on.includes("ja"), zh: on.includes("zh"), en: on.includes("en") });
    }
    if(store.get("tri.pron") === "0") setShowPron(false);
    setTts(canSpeak());
    setReady(true);
  }, []);

  const toggleShow = useCallback((l: Foreign) => setShow(prev => {
    const next = { ...prev, [l]: !prev[l] };
    store.set("tri.langs", FOREIGN.filter(x => next[x]).join(","));
    return next;
  }), []);
  const toggleHide = useCallback((l: LangCode) => setHide(prev => ({ ...prev, [l]: !prev[l] })), []);
  const togglePron = useCallback(() => setShowPron(prev => { store.set("tri.pron", prev ? "0" : "1"); return !prev; }), []);

  const value = useMemo(() => ({ show, hide, showPron, tts, ready, toggleShow, toggleHide, togglePron }),
    [show, hide, showPron, tts, ready, toggleShow, toggleHide, togglePron]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSettings = () => {
  const s = useContext(Ctx);
  if(!s) throw new Error("SettingsProvider가 필요합니다");
  return s;
};

export const getStore = store;
