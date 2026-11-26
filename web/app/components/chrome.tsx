import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router";
import type { Section as SectionT } from "@data";
import { isChart, isConcept } from "~/lib/sections";
import { LANG_LABEL, SECTION_LANG, stageLabel, stageMark, useStages, type LangCode } from "~/lib/stages";
import { useSettings } from "~/state/settings";
import { KindBadge } from "./sections";

export const VERSION = `v${__APP_VERSION__.replace(/\.0$/, "")}`;

const BrandMark = () => (
  <span aria-hidden="true" className="inline-flex gap-[3px] items-end h-5">
    <i className="block w-1 h-[11px] rounded-sm bg-ko" /><i className="block w-1 h-5 rounded-sm bg-ja" />
    <i className="block w-1 h-[17px] rounded-sm bg-zh" /><i className="block w-1 h-[14px] rounded-sm bg-en" />
  </span>
);

/* ───────── 단계 탭 (데스크톱 상단, 모바일 하단) ───────── */
export const StageTabs = () => { const stages = useStages(); return (
  <nav aria-label="학습 단계" className="stage-seg hidden md:inline-flex bg-sheet border border-line rounded-full p-[3px] gap-0.5">
    {stages.map(st => (
      <NavLink key={st.id} to={`/${st.slug}`} aria-label={`${stageLabel(st.id)} ${st.name}`}
        className={({ isActive }) => `rounded-full px-4 min-h-[34px] text-sm font-medium flex gap-1.5 items-center whitespace-nowrap transition-colors ${isActive ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}>
        <b className="font-bold tabular-nums">{stageMark(st.id)}</b><span>{st.short}</span>
      </NavLink>
    ))}
  </nav>
); };

export const TabBar = () => { const stages = useStages(); return (
  <nav aria-label="학습 단계" className="tabbar md:hidden grid grid-cols-5 gap-1 fixed inset-x-0 bottom-0 z-40 px-2 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] bg-paper border-t border-line">
    {stages.map(st => (
      <NavLink key={st.id} to={`/${st.slug}`} aria-label={`${stageLabel(st.id)} ${st.name}`}
        className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 min-h-[54px] rounded-xl text-xs font-medium ${isActive ? "text-ink bg-sheet ring-1 ring-line" : "text-muted"}`}>
        <b className="text-[19px] leading-tight font-bold">{stageMark(st.id)}</b><span>{st.short}</span>
      </NavLink>
    ))}
  </nav>
); };

/* ───────── 보기 설정 패널 ───────── */
function Chip({ on, lang, onClick, children, id }: { on: boolean; lang?: LangCode; onClick: () => void; children: ReactNode; id: string }){
  return (
    <button type="button" id={id} role="switch" aria-checked={on} onClick={onClick}
      className={`chip min-h-9 rounded-full px-3.5 text-sm font-medium inline-flex items-center gap-1.5 border ${on ? "border-transparent text-white" : "border-line-2 bg-raised text-ink-2"}`}
      style={on ? { background: lang ? `var(--${lang})` : "var(--ink)", color: lang ? "#fff" : "var(--paper)" } : undefined}>
      <i className="size-2 rounded-full" style={{ background: on ? (lang ? "#fff" : "var(--paper)") : lang ? `var(--${lang})` : "var(--muted)" }} />
      {children}
    </button>
  );
}

export function ViewSettings(){
  const { show, hide, showPron, toggleShow, toggleHide, togglePron } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const changed = Object.values(hide).some(Boolean) || Object.values(show).some(v => !v);

  useEffect(() => {
    if(!open) return;
    const onKey = (e: KeyboardEvent) => { if(e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => { if(!(e.target as Element).closest(".top")) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);

  const label = "text-[13px] text-muted mr-1 w-full md:w-auto";
  return (
    <div ref={ref} className="view">
      <button type="button" aria-expanded={open} aria-controls="view-panel" aria-label="보기 설정" onClick={() => setOpen(o => !o)}
        className={`icon-btn relative h-10 w-10 md:w-auto md:px-3.5 rounded-full border bg-sheet flex gap-1.5 items-center justify-center text-sm font-medium ${open ? "border-ink text-ink" : "border-line text-ink-2"}`}>
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
        <span className="hidden md:inline">보기 설정</span>
        {changed && <span aria-hidden="true" className="dot absolute top-[7px] right-[9px] size-[7px] rounded-full bg-ja" />}
      </button>
      {open && (
        <div id="view-panel" className="view-panel absolute inset-x-0 top-full border-y border-line bg-sheet shadow-card">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-4 flex flex-wrap gap-x-8 gap-y-3.5 items-center">
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <span className={label}>공부할 언어</span>
              {(["ja", "zh", "en"] as const).map(l => <Chip key={l} id={`show-${l}`} on={show[l]} lang={l} onClick={() => toggleShow(l)}>{LANG_LABEL[l]}</Chip>)}
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <span className={label}>가리기</span>
              {(["ko", "ja", "zh", "en"] as const).map(l => <Chip key={l} id={`hide-${l}`} on={hide[l]} lang={l} onClick={() => toggleHide(l)}>{LANG_LABEL[l]}</Chip>)}
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <span className={label}>발음</span>
              <Chip id="show-pron" on={showPron} onClick={togglePron}>발음 표시 (후리가나·병음·한글 발음)</Chip>
            </div>
            <p className="basis-full m-0 text-[13px] text-muted">
              가린 칸을 누르면 그 칸만 보입니다. 한글 발음의 <b className="font-bold text-ink-2 overline">굵은 윗줄</b>은 높게·세게, 화살표는 중국어 성조입니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── 상단 바 ───────── */
export const TopBar = ({ search }: { search?: ReactNode }) => (
  <header className="top sticky top-0 z-40 bg-paper border-b border-line">
    <div className="max-w-[1240px] mx-auto px-4 md:px-8 h-[60px] md:h-16 flex items-center gap-2 md:gap-6">
      <Link to="/" aria-label="네 언어 공부노트 홈" className="brand flex items-center gap-2.5 font-bold text-[15px] tracking-tight text-ink whitespace-nowrap">
        <BrandMark /><span className="hidden md:inline">네 언어 공부노트</span>
      </Link>
      <StageTabs />
      <div className="ml-auto flex gap-2 items-center flex-1 md:flex-none justify-end">
        {search}
        <ViewSettings />
      </div>
    </div>
  </header>
);

export const SearchBox = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <label className="search flex flex-1 md:flex-none items-center gap-2 bg-sheet border border-line focus-within:border-ink rounded-full px-3.5 h-10 md:w-[280px] text-muted transition-colors">
    <svg className="size-[18px] flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
    <span className="sr-only">검색</span>
    <input id="q" type="search" value={value} onChange={e => onChange(e.target.value)} autoComplete="off"
      placeholder="한국어, 日本語, 中文, English, 병음으로 검색" className="border-0 bg-transparent outline-0 text-sm text-ink w-full min-w-0 h-full placeholder:text-muted" />
  </label>
);

/* ───────── 목차 ───────── */
export function Toc({ stageId, sections, counts, totals, active }: { stageId: number; sections: SectionT[]; counts: Record<string, number | null>; totals: Record<string, number>; active: string }){
  const { show } = useSettings();
  const ref = useRef<HTMLElement>(null);
  // 모바일 가로 칩 목록에서 현재 주제가 보이게 유지
  useEffect(() => {
    const nav = ref.current;
    const a = nav?.querySelector<HTMLElement>(`a[data-for="${active}"]`);
    if(nav && a && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: nav.scrollLeft + a.getBoundingClientRect().left - nav.getBoundingClientRect().left - 16, behavior: "smooth" });
  }, [active]);
  return (
    <nav ref={ref} id="toc" aria-label="주제 목록"
      className="toc no-scrollbar sticky top-[60px] md:top-[88px] z-20 self-start flex md:block gap-1.5 overflow-x-auto md:overflow-auto md:max-h-[calc(100vh-112px)] -mx-4 md:mx-0 mb-4 md:mb-0 px-4 md:px-0 py-2.5 md:py-0 bg-paper md:bg-transparent border-b border-line md:border-0">
      <p className="hidden md:block text-[13px] text-muted mb-3 ml-3 font-medium">{stageLabel(stageId)} 주제</p>
      {sections.map(sec => {
        const lang = SECTION_LANG[sec.type];
        if(lang && !show[lang]) return null;
        const n = counts[sec.id];
        if(n === 0) return null;
        const on = sec.id === active;
        return (
          <a key={sec.id} href={`#${sec.id}`} data-for={sec.id} aria-current={on ? "location" : undefined}
            className={`flex-none flex items-center gap-2 px-3.5 md:px-3 py-1.5 md:py-2 rounded-full md:rounded-[10px] border md:border-0 text-sm leading-snug whitespace-nowrap md:whitespace-normal ${on ? "on bg-ink text-paper border-ink" : "bg-sheet md:bg-transparent border-line text-ink-2 md:hover:bg-sheet"}`}>
            {isConcept(sec) && <KindBadge small />}
            {/* 긴 제목은 제목만 줄바꿈되고 배지와 개수는 한 줄로 유지 */}
            <span className="toc-t min-w-0">{sec.title}</span>
            <span className={`hidden md:inline shrink-0 ml-auto text-xs tabular-nums ${on ? "opacity-70" : "text-muted"}`}>{isChart(sec) ? `${totals[sec.id]}자` : n ?? totals[sec.id]}</span>
          </a>
        );
      })}
    </nav>
  );
}

export const Footer = () => (
  <footer className="max-w-[1240px] mx-auto px-4 md:px-8 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-12 text-muted text-[13px]">
    홈 화면에 추가하면 인터넷 없이도 볼 수 있습니다. 발음 듣기는 기기의 음성 엔진을 사용합니다.
    <span className="ver ml-1.5 tabular-nums border border-line rounded-full px-2 py-px">{VERSION}</span>
  </footer>
);
