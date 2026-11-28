import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Footer, TabBar, TopBar } from "~/components/chrome";
import { Pron } from "~/components/cells";
import { TOEIC_ID, TRAVEL_ID, stageMark, useStages } from "~/lib/stages";
import { LAST_KEY, lastInStage } from "~/lib/topics";
import { getStore } from "~/state/settings";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "네 언어 공부노트 · 한국어로 배우는 일본어, 중국어, 영어" },
  { name: "description", content: "한 문장을 한국어, 일본어, 중국어, 영어로 나란히 익히는 공부노트. 모든 외국어에 한글 발음과 높낮이를 붙였습니다." },
];

const SAMPLE = [
  { l: "ko", label: "한국어", text: "잘 부탁드립니다" },
  { l: "ja", label: "日本語", text: "よろしくお願いします", pron: "요[로시]쿠 오[네가이시마](스)", font: "font-mincho text-[19px]" },
  { l: "zh", label: "中文", text: "请多关照", pron: "칭3 뚜어1 꽌1 짜오4", font: "font-hanzi text-[19px]" },
  { l: "en", label: "English", text: "I look forward to working with you.", pron: "(아이) [룩] [포]워드 (투) [워]킹 (위드) 유" },
] as const;

export default function Home(){
  // 마지막으로 본 단계 (stage 화면에서 저장)
  const stages = useStages();
  const [last, setLast] = useState<string | null>(null);
  const [lastTopic, setLastTopic] = useState<string | null>(null);
  useEffect(() => { setLast(getStore.get("tri.slug")); setLastTopic(getStore.get(LAST_KEY)); }, []);
  const lastStage = stages.find(st => st.slug === last);
  // 마지막으로 본 단계 안의 주제가 있으면 그 주제로 바로 이어 본다 (v2.4)
  const resume = lastStage && (lastInStage(lastTopic, lastStage.slug) ?? `/${lastStage.slug}`);

  return (
    <>
      <TopBar />
      <main id="top">
        <section className="hero max-w-[1240px] mx-auto px-4 md:px-8 pt-8 pb-8 md:pt-[72px] md:pb-16 grid gap-6 md:gap-12 lg:grid-cols-[1.05fr_1fr] items-center">
          <div>
            <h1 className="text-[32px] md:text-[clamp(34px,4.8vw,56px)] leading-[1.12] tracking-[-.028em] font-bold mb-5">한 문장을<br />네 언어로 익힙니다</h1>
            <p className="text-base md:text-lg leading-[1.7] text-ink-2 max-w-[31em] mb-6 md:mb-8">
              한국어로 뜻을 잡고, 같은 말을 일본어, 중국어, 영어로 바로 옆에서 비교합니다. 기본, 중급, 심화 세 단계마다 문법 개념을 먼저 익히고 단어와 회화로 넘어가며, 주제를 하나씩 끝내면 진도가 기록됩니다. 여행 탭에서는 현지에서 바로 쓰는 표현과 '보여 주기 카드'를, TOEIC 탭에서는 시험 구성과 빈출 표현, Part 5 문제를 봅니다. 외국어를 처음 배우는 분도 읽을 수 있게 모든 문장에 한글 발음과 높낮이를 붙였습니다.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link to={resume ?? "/basic"} className="cta rounded-full bg-ink text-paper px-5 py-3 font-medium">
                {lastStage ? `이어서 보기 · ${lastStage.short}` : "기본부터 시작하기"}
              </Link>
            </div>
          </div>
          <div className="sample bg-raised border border-line rounded-2xl px-[18px] md:px-6 py-1 md:py-2 shadow-card" aria-label="예시 문장">
            {SAMPLE.map(s => (
              <div key={s.l} className="grid grid-cols-[52px_1fr] md:grid-cols-[64px_1fr] gap-3 items-baseline py-3 border-t border-dashed border-line first:border-t-0">
                <span className="text-xs font-bold" style={{ color: `var(--${s.l})` }}>{s.label}</span>
                <p className={`m-0 ${"font" in s ? s.font : "text-base"}`} lang={s.l === "zh" ? "zh-CN" : s.l}>
                  {s.text}
                  {"pron" in s && <Pron text={s.pron} lang={s.l} className="font-sans !text-[12.5px]" />}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="학습 단계" className="max-w-[1240px] mx-auto px-4 md:px-8 pb-16 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stages.map(st => {
            const { concepts, items } = st;
            return (
              <Link key={st.id} to={`/${st.slug}`} className="stage-card group bg-sheet border border-line rounded-2xl p-6 hover:border-ink transition-colors">
                <div className="text-[56px] leading-[.8] font-bold tracking-tighter text-transparent mb-4" style={{ WebkitTextStroke: "1.5px var(--ink)" }} aria-hidden="true">{stageMark(st.id)}</div>
                <h2 className="text-xl font-bold mb-2">{st.name}</h2>
                <p className="text-sm text-ink-2 leading-relaxed mb-4">{st.desc}</p>
                <p className="text-[13px] text-muted">{st.id === TRAVEL_ID ? `장면 ${st.sections}개 · 표현 ${items}개` : st.id === TOEIC_ID ? `파트·주제 ${st.sections}개 · 표현과 문제 ${items}개` : `개념 ${concepts}개 · 주제 ${st.sections}개 · 표현 ${items}개`}</p>
              </Link>
            );
          })}
        </section>
      </main>
      <Footer />
      <TabBar />
    </>
  );
}
