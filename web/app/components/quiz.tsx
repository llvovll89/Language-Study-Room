import { useEffect, useRef, useState } from "react";
import type { Section } from "@data";
import { BLANK, buildQuiz, quizzable, readWrong, updateWrong, WRONG_KEY, type QLang, type Question } from "~/lib/quiz";
import { speak } from "~/lib/speech";
import { HTML_LANG, LANG_LABEL, TTS_LANG } from "~/lib/stages";
import { getStore, useSettings } from "~/state/settings";
import { Pron } from "./cells";

/* 문제와 풀이 (v2.2): 섹션 아래 "문제 풀기" → 전체 화면 <dialog>에서 10문제
   - 공부할 언어로 켠 언어로만 출제, TTS가 있으면 듣기 문제도 냄
   - 틀린 문제는 오답 노트(localStorage tri.wrong)에 저장, 맞히면 지움 */

const TYPE_LABEL: Record<Question["type"], string> = {
  meaning: "뜻 고르기", foreign: "외국어 고르기", listen: "듣고 고르기", cloze: "빈칸 채우기",
};
const FONT: Record<QLang, string> = { ja: "font-mincho", zh: "font-hanzi", en: "font-sans" };
const sayText = (q: Question) => (q.lang === "ja" ? q.source.ja.sub || q.source.ja.text : q.source[q.lang].text);

/** 오답 노트 목록 (여러 섹션이 같이 쓰므로 storage 이벤트 대신 열 때마다 다시 읽는다) */
const loadWrong = () => readWrong(k => getStore.get(k));
const saveWrong = (list: string[]) => getStore.set(WRONG_KEY, JSON.stringify(list));

function QuizDialog({ questions, onClose }: { questions: Question[]; onClose: () => void }){
  const ref = useRef<HTMLDialogElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const { showPron, tts } = useSettings();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const done = i >= questions.length;
  const q = questions[i];

  useEffect(() => { ref.current?.showModal(); }, []);
  // 답을 고르면 정답 확인과 "다음 문제" 버튼이 보이게 스크롤
  useEffect(() => { if(picked !== null) feedbackRef.current?.scrollIntoView({ block: "nearest" }); }, [picked]);
  // 듣기 문제는 나오자마자 한 번 읽어 준다
  useEffect(() => { if(q?.type === "listen" && picked === null) speak(sayText(q), TTS_LANG[q.lang]); }, [i]);

  const choose = (n: number) => {
    if(picked !== null || !q) return;
    setPicked(n);
    const ok = n === q.answer;
    if(ok) setScore(s => s + 1); else setWrongIds(w => [...w, q.id]);
    saveWrong(updateWrong(loadWrong(), q.id, ok));
  };
  const next = () => { setPicked(null); setI(n => n + 1); };

  const choiceFont = q && (q.type === "foreign" || q.type === "cloze") ? FONT[q.lang] : "";
  const choiceLang = q && (q.type === "foreign" || q.type === "cloze") ? HTML_LANG[q.lang] : "ko";

  return (
    <dialog ref={ref} onClose={onClose} aria-label="문제 풀기"
      className="quiz-dialog m-0 p-0 w-full h-full max-w-none max-h-none bg-paper text-ink backdrop:bg-black/60">
      <div className="h-full max-w-2xl mx-auto flex flex-col px-5 md:px-8 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <span className="quiz-progress text-sm text-muted tabular-nums">{done ? "결과" : `${i + 1} / ${questions.length}`}</span>
          <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden" aria-hidden="true">
            <div className="h-full bg-ink transition-[width]" style={{ width: `${(Math.min(i + (picked !== null ? 1 : 0), questions.length) / questions.length) * 100}%` }} />
          </div>
          <button type="button" onClick={() => ref.current?.close()} aria-label="닫기"
            className="size-11 rounded-full border border-line bg-sheet grid place-items-center text-xl text-ink-2">✕</button>
        </div>

        {done ? (
          <div className="quiz-result flex-1 flex flex-col justify-center items-center text-center gap-4">
            <p className="text-6xl font-bold tabular-nums m-0">{score} / {questions.length}</p>
            <p className="text-ink-2 m-0">{score === questions.length ? "모두 맞혔어요! 🎉" : `틀린 ${questions.length - score}문제는 오답 노트에 저장했어요.`}</p>
            <button type="button" onClick={() => ref.current?.close()} className="rounded-full bg-ink text-paper px-6 min-h-12 font-medium">닫기</button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col py-6 min-h-0 overflow-y-auto">
            <p className="quiz-type text-xs font-bold mb-3" style={{ color: `var(--${q.lang})` }}>{TYPE_LABEL[q.type]} · {LANG_LABEL[q.lang]}</p>

            {q.type === "listen" ? (
              <button type="button" onClick={() => speak(sayText(q), TTS_LANG[q.lang])} className="quiz-play self-start rounded-2xl bg-ink text-paper px-6 py-5 text-lg font-medium">🔊 다시 듣기</button>
            ) : (
              <p lang={q.type === "foreign" ? "ko" : HTML_LANG[q.lang]}
                className={`quiz-prompt m-0 font-bold leading-snug text-[clamp(24px,6vw,38px)] ${q.type === "foreign" ? "" : FONT[q.lang]}`}>
                {q.type === "cloze" ? q.prompt.split(BLANK).flatMap((part, k) => k ? [<span key={k} className="inline-block min-w-16 border-b-4 border-current mx-1 align-baseline">&nbsp;</span>, part] : [part]) : q.prompt}
              </p>
            )}
            {q.type === "cloze" && <p className="m-0 mt-2 text-ink-2">뜻: {q.source.ko}</p>}

            <div key={i} role="radiogroup" aria-label="보기" className="quiz-choices grid gap-2.5 mt-6">
              {q.choices.map((c, n) => {
                const state = picked === null ? "" : n === q.answer ? "correct" : n === picked ? "wrong" : "dim";
                return (
                  <button key={n} type="button" role="radio" aria-checked={picked === n} disabled={picked !== null}
                    data-state={state || undefined} onClick={() => choose(n)} lang={choiceLang}
                    className={`text-left rounded-xl border px-4 py-3.5 text-[17px] ${choiceFont} ${
                      state === "correct" ? "border-ko bg-ko-soft text-ink font-bold" :
                      state === "wrong" ? "border-ja bg-ja-soft text-ink" :
                      state === "dim" ? "border-line bg-sheet text-muted" : "border-line bg-raised hover:border-ink"}`}>
                    <span className="text-muted text-sm mr-2 font-sans">{n + 1}</span>{c}
                  </button>
                );
              })}
            </div>

            {picked !== null && (
              <div ref={feedbackRef} className={`quiz-feedback mt-5 rounded-xl p-4 ${q.lang}`} style={{ background: picked === q.answer ? "var(--ko-soft)" : "var(--ja-soft)" }}>
                <p className="m-0 font-bold mb-2">{picked === q.answer ? "⭕ 정답입니다" : "❌ 아쉬워요. 정답을 확인하세요"}</p>
                <p lang={HTML_LANG[q.lang]} className={`m-0 text-lg ${FONT[q.lang]}`}>{q.source[q.lang].text}</p>
                {showPron && q.source[q.lang].sub && <p className="m-0 text-sm text-muted">{q.source[q.lang].sub}</p>}
                {showPron && <Pron text={q.source[q.lang].pron} lang={q.lang} />}
                <p className="m-0 mt-1 text-ink-2">{q.source.ko}</p>
                <div className="flex gap-2 mt-3">
                  {tts && <button type="button" onClick={() => speak(sayText(q), TTS_LANG[q.lang])} className="rounded-full border border-line bg-sheet px-4 min-h-10 text-sm">🔊 듣기</button>}
                  <button type="button" onClick={next} className="quiz-next ml-auto rounded-full bg-ink text-paper px-5 min-h-10 font-medium">{i + 1 < questions.length ? "다음 문제" : "결과 보기"}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}

/** 섹션 아래 문제 풀기 버튼 (JS가 있을 때만) */
export function QuizLauncher({ sec }: { sec: Section }){
  const { show, tts, ready } = useSettings();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const langs = (["ja", "zh", "en"] as const).filter(l => show[l]);
  const refreshWrong = () => setWrongCount(loadWrong().filter(id => id.startsWith(`${sec.id}:`)).length);

  useEffect(() => { if(ready) refreshWrong(); }, [ready, sec.id]);
  if(!ready || !langs.length || !quizzable(sec)) return null;

  const start = (onlyWrong: boolean) => {
    const only = onlyWrong ? loadWrong().filter(id => id.startsWith(`${sec.id}:`)) : undefined;
    const qs = buildQuiz(sec, { langs, tts, only });
    if(qs.length) setQuestions(qs);
  };

  return (
    <div className="quiz-launch flex flex-wrap items-center gap-2 border-t border-line pt-4 pb-3 md:pb-1 mt-2">
      <button type="button" onClick={() => start(false)} className="quiz-start rounded-full bg-ink text-paper px-4 min-h-10 text-sm font-medium">📝 문제 풀기</button>
      {wrongCount > 0 && (
        <button type="button" onClick={() => start(true)} className="quiz-retry rounded-full border border-ja text-ja px-4 min-h-10 text-sm font-medium">
          오답 다시 풀기 <span className="tabular-nums">{wrongCount}</span>
        </button>
      )}
      <span className="text-xs text-muted">공부할 언어로 켠 {langs.map(l => LANG_LABEL[l]).join(", ")}에서 출제됩니다</span>
      {questions && <QuizDialog questions={questions} onClose={() => { setQuestions(null); refreshWrong(); }} />}
    </div>
  );
}
