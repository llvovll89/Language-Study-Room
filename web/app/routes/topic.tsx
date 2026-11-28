import { useEffect, useState } from "react";
import { data, Link, useNavigate } from "react-router";
import { Footer, SearchBox, TabBar, TopBar } from "~/components/chrome";
import { ChartsContext, Section } from "~/components/sections";
import { Pager, TopicNav, useProgress, useVisibleParts, type PagerLink } from "~/components/topics";
import { topicPayload } from "~/lib/content.server";
import { stageLabel, useStages } from "~/lib/stages";
import { LAST_KEY, topicPath } from "~/lib/topics";
import { getStore } from "~/state/settings";
import type { Route } from "./+types/topic";

/* 주제 페이지 (v2.4): /basic/greet 처럼 섹션 하나
   내용 → 문제 풀기 → 이전/다음 주제. 끝까지 보면 완료로 기록한다 */
export function loader({ params }: Route.LoaderArgs){
  const payload = topicPayload(params.stage, params.topic);
  if(!payload) throw data(null, { status: 404 });
  return payload;
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if(!loaderData) return [{ title: "네 언어 공부노트" }];
  const { stage, section } = loaderData;
  return [
    { title: `${section.title} · ${stageLabel(stage.id)} ${stage.short} · 네 언어 공부노트` },
    { name: "description", content: section.note?.[0] ?? stage.desc },
  ];
};

export default function TopicPage({ loaderData }: Route.ComponentProps){
  const { stage, slug, section, count, parts, charts } = loaderData;
  const navigate = useNavigate();
  const stages = useStages();
  const [q, setQ] = useState("");
  const { done, markDone } = useProgress();
  const visibleParts = useVisibleParts(parts);
  const hub = `/${slug}`;
  const label = stageLabel(stage.id);

  // 이전/다음 순서: 보이는 주제 + 지금 주제 (꺼 둔 언어의 글자표를 직접 열었을 때도 위치가 맞게)
  const visibleIds = new Set(visibleParts.flatMap(p => p.topics.map(t => t.id)));
  const topics = parts.flatMap(p => p.topics).filter(t => t.id === section.id || visibleIds.has(t.id));
  const at = topics.findIndex(t => t.id === section.id);
  const part = parts.find(p => p.topics.some(t => t.id === section.id));
  const nextStage = stages[stages.findIndex(s => s.slug === slug) + 1];

  const prev: PagerLink = at > 0
    ? { to: topics[at - 1].path, label: "이전 주제", title: topics[at - 1].title }
    : { to: hub, label: `${label} 주제 목록`, title: "목록으로" };
  const nextTopic = topics[at + 1];
  const next: PagerLink | null = nextTopic
    ? { to: nextTopic.path, label: "다음 주제", title: nextTopic.title }
    : nextStage ? { to: `/${nextStage.slug}`, label: "다음 단계", title: `${stageLabel(nextStage.id)} ${nextStage.short}` } : null;

  useEffect(() => {
    getStore.set("tri.slug", slug);
    getStore.set(LAST_KEY, topicPath(slug, section.id));
    setQ("");
  }, [section.id]);

  return (
    <>
      <TopBar search={<SearchBox value={q} onChange={setQ} action={hub} onSubmit={v => navigate(hub, { state: { q: v } })} />} />
      <div className="layout max-w-[1240px] mx-auto px-4 md:px-8 pt-2 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-[120px] grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-12">
        <TopicNav stageLabel={`${label} ${stage.short}`} hub={hub} parts={visibleParts} current={section.id} done={done} />
        <main id="main" className="topic min-w-0" data-stage={stage.id}>
          <div className="crumb flex items-center justify-between gap-3 pt-3 md:pt-6 pb-3 md:pb-4 text-sm">
            <Link to={hub} className="text-ink-2 hover:text-ink font-medium min-h-10 inline-flex items-center lg:hidden">
              <span aria-hidden="true" className="mr-1">‹</span>{label} {stage.short}<span className="hidden sm:inline">&nbsp;주제 목록</span>
            </Link>
            <span className="text-muted text-right ml-auto min-h-10 inline-flex items-center">
              {part && <span className="hidden sm:inline">{part.title} · </span>}
              <span className="pos tabular-nums">{at + 1} / {topics.length}</span>
            </span>
          </div>
          <ChartsContext.Provider value={charts}>
            <Section sec={section} total={count} visible={undefined} query="" level={1} />
          </ChartsContext.Provider>
          <Pager key={section.id} prev={prev} next={next} onReachEnd={() => markDone(section.id)} />
        </main>
      </div>
      <Footer />
      <TabBar />
    </>
  );
}
