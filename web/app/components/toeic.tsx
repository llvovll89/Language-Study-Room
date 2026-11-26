import { useState } from "react";
import type { ProblemSection, ToeicSection } from "@data";
import { Pron, Say } from "./cells";
import { useSettings } from "~/state/settings";

/* TOEIC 탭 (v2.3): 영어만 다룬다
   - 표현 카드: 영어 + 한글 발음 + 뜻 + 예문 (공부할 언어 설정과 상관없이 영어를 보여 준다)
   - Part 5 문제: JS가 있으면 보기를 눌러 바로 채점, 없으면 <details>로 정답과 해설 */

type Visible = boolean[] | undefined;
const vis = (v: Visible, i: number) => !v || v[i];

export function ToeicBody({ sec, visible }: { sec: ToeicSection; visible: Visible }){
  const { showPron, hide } = useSettings();
  return (
    <div className="toeic-list mb-2">
      {sec.items.map(([en, ep, ko, exEn, exKo], i) => vis(visible, i) && (
        <div key={i} data-item className="toeic-item en grid gap-1.5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-6 py-4 border-t border-line">
          <div className="min-w-0">
            <div className="row">
              <span lang="en" className={`txt font-bold text-[17px] text-ink${hide.en ? " blurred" : ""}`}>{en}</span>
              <Say text={en} lang="en" />
            </div>
            {showPron && <Pron text={ep} lang="en" className={hide.en ? "blurred" : ""} />}
          </div>
          <div className="min-w-0">
            <p className={`m-0 font-medium${hide.ko ? " blurred" : ""}`}>{ko}</p>
            {exEn && (
              <p className="m-0 mt-1.5 text-sm text-ink-2">
                <span lang="en">{exEn}</span>
                <span className={`block text-muted${hide.ko ? " blurred" : ""}`}>{exKo}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const LETTERS = ["A", "B", "C", "D"];

function ProblemCard({ n, item }: { n: number; item: ProblemSection["items"][number] }){
  const { ready } = useSettings();
  const [stem, choices, answer, exp, point] = item;
  const [picked, setPicked] = useState<number | null>(null);
  const parts = stem.split(/_{5,}/);
  return (
    <article data-item className="problem bg-raised border border-line rounded-xl p-4 mb-3">
      <p className="m-0 text-xs font-bold text-en mb-2">{n}. {point}</p>
      <p lang="en" className="m-0 text-[17px] leading-relaxed">
        {parts[0]}<span className="inline-block min-w-14 border-b-2 border-ink mx-1">{picked !== null ? <b className="px-1">{choices[answer]}</b> : " "}</span>{parts.slice(1).join("_____")}
      </p>
      <div role="radiogroup" aria-label={`${n}번 보기`} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        {choices.map((c, k) => {
          const state = picked === null ? "" : k === answer ? "correct" : k === picked ? "wrong" : "dim";
          return (
            <button key={k} type="button" role="radio" aria-checked={picked === k} disabled={!ready || picked !== null}
              data-state={state || undefined} onClick={() => setPicked(k)} lang="en"
              className={`text-left rounded-lg border px-3 py-2 ${
                state === "correct" ? "border-ko bg-ko-soft font-bold" :
                state === "wrong" ? "border-ja bg-ja-soft" :
                state === "dim" ? "border-line text-muted" : "border-line bg-sheet enabled:hover:border-ink"}`}>
              <span className="text-muted mr-2 font-sans">({LETTERS[k]})</span>{c}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <div className="problem-exp mt-3 rounded-lg p-3 text-sm" style={{ background: picked === answer ? "var(--ko-soft)" : "var(--ja-soft)" }}>
          <p className="m-0 font-bold mb-1">{picked === answer ? "⭕ 정답" : `❌ 정답은 (${LETTERS[answer]}) ${choices[answer]}`}</p>
          <p className="m-0 text-ink-2 leading-relaxed">{exp}</p>
        </div>
      ) : (
        /* JS 없이도 정답과 해설을 볼 수 있게 (JS가 있으면 보기를 눌러 확인) */
        <details className={`problem-answer mt-3 text-sm${ready ? " hidden" : ""}`}>
          <summary className="cursor-pointer text-muted">정답과 해설 보기</summary>
          <p className="m-0 mt-2 font-bold">정답: ({LETTERS[answer]}) {choices[answer]}</p>
          <p className="m-0 mt-1 text-ink-2 leading-relaxed">{exp}</p>
        </details>
      )}
    </article>
  );
}

export function ProblemBody({ sec, visible }: { sec: ProblemSection; visible: Visible }){
  return (
    <div className="problems mb-2">
      {sec.items.map((it, i) => vis(visible, i) && <ProblemCard key={i} n={i + 1} item={it} />)}
    </div>
  );
}
