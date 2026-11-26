import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { data } from "react-router";
import { Footer, SearchBox, TabBar, Toc, TopBar } from "~/components/chrome";
import { ChartsContext, Section } from "~/components/sections";
import { stagePayload } from "~/lib/content.server";
import { matches, sectionKeys } from "~/lib/search";
import { isChart } from "~/lib/sections";
import { SECTION_LANG, SLUGS } from "~/lib/stages";
import { getStore, useSettings } from "~/state/settings";
import type { Route } from "./+types/stage";

/* prerender 목록에 있는 /basic, /intermediate, /advanced만 존재한다
   그 단계 데이터만 돌려주므로 페이지마다 필요한 콘텐츠만 내려간다 */
export function loader({ params }: Route.LoaderArgs){
  const payload = stagePayload(params.stage);
  if(!payload) throw data(null, { status: 404 });
  return payload;
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const st = loaderData?.stage;
  if(!st) return [{ title: "네 언어 공부노트" }];
  return [
    { title: `${st.id}단계 ${st.name} · 네 언어 공부노트` },
    { name: "description", content: st.desc },
  ];
};

/* 화면에 보이는 섹션을 목차에 표시 */
function useActiveSection(ids: string[]){
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    if(!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-140px 0px -60% 0px" });
    ids.forEach(id => { const el = document.getElementById(id); if(el) io.observe(el); });
    return () => io.disconnect();
  }, [ids.join(",")]);
  return active;
}

export default function StagePage({ loaderData }: Route.ComponentProps){
  const { stage, counts: totals, total, charts } = loaderData;
  const { show } = useSettings();
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim().toLowerCase());

  useEffect(() => { getStore.set("tri.slug", SLUGS[stage.id - 1]); }, [stage.id]);
  // 단계가 바뀌면 검색어를 비운다
  useEffect(() => setQ(""), [stage.id]);

  const keys = useMemo(() => Object.fromEntries(stage.sections.map(s => [s.id, sectionKeys(s)])), [stage]);

  // 섹션별 검색 결과 (글자표는 검색 중 숨김)
  const results = stage.sections.map(sec => {
    const lang = SECTION_LANG[sec.type];
    if(lang && !show[lang]) return { sec, visible: undefined, n: 0 };
    if(isChart(sec)) return { sec, visible: undefined, n: query ? 0 : totals[sec.id] };
    if(!query) return { sec, visible: undefined, n: totals[sec.id] };
    const visible = keys[sec.id].map(k => matches(k, query));
    return { sec, visible, n: visible.filter(Boolean).length };
  });
  const shown = results.filter(r => r.n > 0);
  // 목차 개수: 검색 중이면 맞는 개수, 0이면 목차에서 숨김, null이면 전체 개수 표시
  const counts = Object.fromEntries(results.map(r => [r.sec.id, query || r.n === 0 ? r.n : null]));
  const active = useActiveSection(shown.map(r => r.sec.id));

  return (
    <>
      <TopBar search={<SearchBox value={q} onChange={setQ} />} />
      <div className="layout max-w-[1240px] mx-auto px-4 md:px-8 pt-2 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-[120px] grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-12">
        <Toc stageId={stage.id} sections={stage.sections} counts={counts} totals={totals} active={active} />
        <main id="main" className="stage min-w-0" data-stage={stage.id}>
          <div className="stage-head grid md:grid-cols-[auto_minmax(0,1fr)] gap-3 md:gap-7 items-end pt-4 md:pt-8 pb-6 md:pb-8 mb-5 md:mb-8 border-b border-line">
            <div aria-hidden="true" className="stage-num text-[64px] md:text-[112px] leading-[.78] font-bold tracking-tighter text-transparent select-none" style={{ WebkitTextStroke: "1.5px var(--ink)" }}>{stage.id}</div>
            <div>
              <h1 className="text-[26px] md:text-[clamp(26px,3vw,34px)] leading-tight tracking-tight font-bold mb-2"><span className="sr-only">{stage.id}단계 </span>{stage.name}</h1>
              <p className="m-0 text-ink-2 max-w-[40em]">{stage.desc}</p>
              <p className="stage-meta mt-3 text-[13px] text-muted">주제 {stage.sections.length}개, 표현 {total}개</p>
            </div>
          </div>
          <ChartsContext.Provider value={charts}>
            {shown.map(({ sec, visible }) => <Section key={sec.id} sec={sec} total={totals[sec.id]} visible={visible} query={query} />)}
          </ChartsContext.Provider>
          {shown.length === 0 && (
            <div className="empty-state py-16 px-6 text-center text-muted border border-dashed border-line-2 rounded-2xl">
              <strong className="block text-ink text-[17px] mb-1.5">"{q.trim()}"와 맞는 표현이 {stage.id}단계에 없습니다</strong>
              <span>다른 단계를 누르거나 검색어를 짧게 바꿔 보세요.</span>
            </div>
          )}
        </main>
      </div>
      <Footer />
      <TabBar />
    </>
  );
}
