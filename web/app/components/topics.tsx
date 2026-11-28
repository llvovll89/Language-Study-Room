import { useEffect, useState } from "react";
import { Link } from "react-router";
import { readWrong } from "~/lib/quiz";
import type { PartMeta, TopicMeta } from "~/lib/sections";
import { addDone, DONE_KEY, LAST_KEY, readDone } from "~/lib/topics";
import { getStore, useSettings } from "~/state/settings";

/* 주제별 페이지 (v2.4): 단계 페이지의 주제 목록, 주제 페이지 옆 목록, 이전/다음 */

/** 진도: 끝까지 본 주제, 주제별 오답 수, 마지막 주제 (하이드레이션 뒤에 읽는다) */
export function useProgress(){
  const { ready } = useSettings();
  const [done, setDone] = useState<string[]>([]);
  const [wrong, setWrong] = useState<Record<string, number>>({});
  const [last, setLast] = useState<string | null>(null);
  useEffect(() => {
    if(!ready) return;
    const get = (k: string) => getStore.get(k);
    setDone(readDone(get));
    const w: Record<string, number> = {};
    for(const id of readWrong(get)){ const sec = id.split(":")[0]; w[sec] = (w[sec] || 0) + 1; }
    setWrong(w);
    setLast(get(LAST_KEY));
  }, [ready]);
  const markDone = (id: string) => setDone(prev => {
    const next = addDone(prev, id);
    if(next !== prev) getStore.set(DONE_KEY, JSON.stringify(next));
    return next;
  });
  return { done, wrong, last, markDone };
}

/** 공부할 언어에서 끈 언어의 전용 주제(가나표, 병음표)는 목록과 이전/다음에서 뺀다 */
export function useVisibleParts(parts: PartMeta[]){
  const { show } = useSettings();
  return parts
    .map(p => ({ ...p, topics: p.topics.filter(t => !t.lang || show[t.lang]) }))
    .filter(p => p.topics.length);
}

const countLabel = (t: TopicMeta) => `${t.count}${t.chart ? "자" : "개"}`;

const Kind = ({ t, on = false }: { t: TopicMeta; on?: boolean }) => t.kind ? (
  <span className={`kind shrink-0 text-[10.5px] leading-none font-bold rounded-full px-1.5 py-[3px] ${
    t.kind === "개념" ? (on ? "bg-paper text-ink" : "bg-ink text-paper") : `border ${on ? "border-paper/50" : "border-line-2 text-ink-2"}`}`}>{t.kind}</span>
) : null;

const Check = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
);

/** 단계 페이지의 주제 목록: 묶음(파트)마다 번호가 이어지는 목록 */
export function TopicList({ parts, done, wrong }: { parts: PartMeta[]; done: string[]; wrong: Record<string, number> }){
  let n = 0;
  return (
    <div className="topics grid gap-8 md:gap-10">
      {parts.map((p, pi) => {
        const start = n + 1;
        n += p.topics.length;
        return (
          <section key={p.title} className="part" aria-labelledby={`part-${pi + 1}`}>
            <div className="mb-3 md:mb-4">
              <h2 id={`part-${pi + 1}`} className="text-[18px] md:text-xl font-bold tracking-tight m-0">
                <span className="text-muted font-medium tabular-nums mr-2">{String(pi + 1).padStart(2, "0")}</span>{p.title}
              </h2>
              {p.desc && <p className="m-0 mt-1 text-sm text-muted">{p.desc}</p>}
            </div>
            <ol start={start} className="list-none m-0 p-0 grid gap-2 lg:grid-cols-2">
              {p.topics.map((t, i) => {
                const fin = done.includes(t.id);
                return (
                  <li key={t.id}>
                    <Link to={t.path} data-topic={t.id} data-done={fin || undefined}
                      className="topic-row group flex items-center gap-3 min-h-[60px] px-3.5 py-2.5 rounded-xl bg-sheet border border-line hover:border-ink transition-colors">
                      <span className={`grid place-items-center flex-none size-8 rounded-full text-[13px] font-bold tabular-nums ${fin ? "bg-ko text-paper" : "bg-paper border border-line text-ink-2"}`}>
                        {fin ? <><Check /><span className="sr-only">완료, </span></> : start + i}
                      </span>
                      <span className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                        <Kind t={t} />
                        <span className="font-medium leading-snug">{t.title}</span>
                      </span>
                      <span className="flex-none flex items-center gap-1.5 text-xs text-muted tabular-nums">
                        {wrong[t.id] ? <span className="wrong-n rounded-full border border-ja text-ja px-1.5 py-px">오답 {wrong[t.id]}</span> : null}
                        {countLabel(t)}
                        <span aria-hidden="true" className="text-base text-line-2 group-hover:text-ink">›</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

/** 주제 페이지 왼쪽 목록 (데스크톱) */
export function TopicNav({ stageLabel, hub, parts, current, done }: { stageLabel: string; hub: string; parts: PartMeta[]; current: string; done: string[] }){
  return (
    <nav aria-label="주제 목록" className="topic-nav hidden lg:block sticky top-[88px] self-start max-h-[calc(100vh-112px)] overflow-auto no-scrollbar pb-6">
      <Link to={hub} className="block text-[13px] text-muted hover:text-ink mb-3 ml-3 font-medium">‹ {stageLabel} 주제 목록</Link>
      {parts.map(p => (
        <div key={p.title} className="mb-4">
          <p className="text-xs text-muted font-bold mb-1 ml-3">{p.title}</p>
          {p.topics.map(t => {
            const on = t.id === current;
            return (
              <Link key={t.id} to={t.path} data-for={t.id} aria-current={on ? "page" : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-sm leading-snug ${on ? "on bg-ink text-paper" : "text-ink-2 hover:bg-sheet"}`}>
                <Kind t={t} on={on} />
                <span className="min-w-0">{t.title}</span>
                <span className={`shrink-0 ml-auto ${on ? "" : "text-ko"}`}>{done.includes(t.id) ? <><Check /><span className="sr-only">완료</span></> : null}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export interface PagerLink { to: string; label: string; title: string }

/** 주제 끝: 이전/다음 주제. 보이면 그 주제를 완료로 기록한다 */
export function Pager({ prev, next, onReachEnd }: { prev: PagerLink; next: PagerLink | null; onReachEnd: () => void }){
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if(!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(es => { if(es.some(e => e.isIntersecting)){ onReachEnd(); io.disconnect(); } });
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  const card = "pager-link flex flex-col gap-1 min-h-[72px] justify-center px-4 py-3 rounded-xl bg-sheet border border-line hover:border-ink transition-colors";
  return (
    <nav ref={setEl} aria-label="주제 이동" className="pager grid grid-cols-2 gap-2.5 md:gap-4 mt-2">
      <Link to={prev.to} rel="prev" className={card}>
        <span className="text-xs text-muted">‹ {prev.label}</span>
        <b className="font-bold leading-snug">{prev.title}</b>
      </Link>
      {next ? (
        <Link to={next.to} rel="next" className={`${card} text-right items-end`}>
          <span className="text-xs text-muted">{next.label} ›</span>
          <b className="font-bold leading-snug">{next.title}</b>
        </Link>
      ) : <span />}
    </nav>
  );
}
