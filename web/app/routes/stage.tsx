import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { data, Link, useLocation, useNavigate } from "react-router";
import { Footer, SearchBox, TabBar, TopBar } from "~/components/chrome";
import { Section } from "~/components/sections";
import { TopicList, useProgress, useVisibleParts } from "~/components/topics";
import { stagePayload } from "~/lib/content.server";
import { matches, sectionKeys } from "~/lib/search";
import { isChart } from "~/lib/sections";
import { SECTION_LANG, stageLabel, stageMark } from "~/lib/stages";
import { lastInStage, topicPath } from "~/lib/topics";
import { getStore, useSettings } from "~/state/settings";
import type { Route } from "./+types/stage";

/* 단계 페이지 (v2.4): 주제 목록 + 단계 전체 검색
   prerender 목록의 /basic, /intermediate, /advanced, /travel, /toeic만 존재한다 */
export function loader({ params }: Route.LoaderArgs){
  const payload = stagePayload(params.stage);
  if(!payload) throw data(null, { status: 404 });
  return payload;
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const st = loaderData?.stage;
  if(!st) return [{ title: "네 언어 공부노트" }];
  return [
    { title: `${stageLabel(st.id)} ${st.name} · 네 언어 공부노트` },
    { name: "description", content: st.desc },
  ];
};

export default function StagePage({ loaderData }: Route.ComponentProps){
  const { stage, slug, parts, counts: totals, total } = loaderData;
  const { show, ready } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim().toLowerCase());
  const { done, wrong, last } = useProgress();
  const visibleParts = useVisibleParts(parts);
  const topics = visibleParts.flatMap(p => p.topics);

  useEffect(() => { getStore.set("tri.slug", slug); }, [slug]);
  // 단계가 바뀌면 검색어를 비운다. 주제 페이지에서 Enter로 넘어온 검색어(state)나 ?q=는 이어받는다
  useEffect(() => {
    const st = location.state as { q?: string } | null;
    setQ(st?.q ?? new URLSearchParams(location.search).get("q") ?? "");
  }, [stage.id, location.key]);
  // 예전 주소 /basic#s1-greet → 주제 페이지로
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if(id && stage.sections.some(s => s.id === id)) navigate(topicPath(slug, id), { replace: true });
  }, [location.hash]);

  const keys = useMemo(() => Object.fromEntries(stage.sections.map(s => [s.id, sectionKeys(s)])), [stage]);

  // 검색 중일 때만: 섹션별로 맞는 항목 (글자표와 꺼 둔 언어의 전용 섹션은 제외)
  const results = query ? stage.sections.flatMap(sec => {
    const lang = SECTION_LANG[sec.type];
    if(isChart(sec) || (lang && !show[lang])) return [];
    const visible = keys[sec.id].map(k => matches(k, query));
    const n = visible.filter(Boolean).length;
    return n ? [{ sec, visible }] : [];
  }) : [];

  const resume = lastInStage(last, slug);
  const resumeTopic = resume ? topics.find(t => t.path === resume) : undefined;
  const start = resumeTopic ?? topics[0];
  const doneN = topics.filter(t => done.includes(t.id)).length;

  return (
    <>
      <TopBar search={<SearchBox value={q} onChange={setQ} />} />
      <div className="layout max-w-[1240px] mx-auto px-4 md:px-8 pt-2 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-[120px]">
        <main id="main" className="stage min-w-0" data-stage={stage.id}>
          <div className="stage-head grid md:grid-cols-[auto_minmax(0,1fr)] gap-3 md:gap-7 items-end pt-4 md:pt-8 pb-6 md:pb-8 mb-6 md:mb-8 border-b border-line">
            <div aria-hidden="true" className="stage-num text-[64px] md:text-[112px] leading-[.78] font-bold tracking-tighter text-transparent select-none" style={{ WebkitTextStroke: "1.5px var(--ink)" }}>{stageMark(stage.id)}</div>
            <div>
              <h1 className="text-[26px] md:text-[clamp(26px,3vw,34px)] leading-tight tracking-tight font-bold mb-2"><span className="sr-only">{stageLabel(stage.id)} </span>{stage.name}</h1>
              <p className="m-0 text-ink-2 max-w-[40em]">{stage.desc}</p>
              <p className="stage-meta mt-3 text-[13px] text-muted">주제 {stage.sections.length}개, 표현 {total}개</p>
              {start && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-5">
                  <Link to={start.path} className="resume rounded-full bg-ink text-paper px-5 min-h-11 inline-flex items-center font-medium">
                    {resumeTopic ? `이어서 보기 · ${resumeTopic.title}` : "첫 주제부터 시작"} <span aria-hidden="true" className="ml-1.5">›</span>
                  </Link>
                  {ready && doneN > 0 && (
                    <div className="progress flex items-center gap-2.5 text-sm text-ink-2">
                      <span className="w-28 h-1.5 rounded-full bg-line overflow-hidden" aria-hidden="true">
                        <span className="block h-full bg-ko" style={{ width: `${(doneN / topics.length) * 100}%` }} />
                      </span>
                      <span className="tabular-nums">완료 {doneN} / {topics.length}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {!query ? <TopicList parts={visibleParts} done={done} wrong={wrong} /> : (
            <>
              <p className="search-meta text-sm text-muted mb-4">
                {stageLabel(stage.id)} 전체에서 <b className="text-ink">"{q.trim()}"</b> 검색 결과 · 주제 {results.length}개
              </p>
              {results.map(({ sec, visible }) => (
                <Section key={sec.id} sec={sec} total={totals[sec.id]} visible={visible} query={query} level={2} href={topicPath(slug, sec.id)} />
              ))}
              {results.length === 0 && (
                <div className="empty-state py-16 px-6 text-center text-muted border border-dashed border-line-2 rounded-2xl">
                  <strong className="block text-ink text-[17px] mb-1.5">"{q.trim()}"와 맞는 표현이 {stageLabel(stage.id)}에 없습니다</strong>
                  <span>다른 탭을 누르거나 검색어를 짧게 바꿔 보세요.</span>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <Footer />
      <TabBar />
    </>
  );
}
