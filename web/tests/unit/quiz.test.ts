/* 문제 생성 단위 테스트: node --test web/tests/unit (Node 22 type stripping) */
import { test } from "node:test";
import assert from "node:assert/strict";
import { STAGES, TOEIC, TRAVEL } from "../../../data/index.js";
import { BLANK, buildQuiz, clozeFor, englishOnly, markersOf, quizzable, toQItems, updateWrong, type QLang } from "../../app/lib/quiz.ts";

/* 재현 가능한 난수 */
const seeded = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const ALL = [...STAGES, TRAVEL, TOEIC].flatMap(st => st.sections);
const LANGS: QLang[] = ["ja", "zh", "en"];

test("모든 학습 섹션(list/dialog/pattern/concept/card)에서 문제를 낼 수 있다", () => {
  const targets = ALL.filter(s => ["list", "dialog", "pattern", "concept", "card", "toeic", "problems"].includes(s.type));
  assert.ok(targets.length > 40);
  for(const s of targets) assert.ok(quizzable(s), s.id);
  // 표와 글자표는 문제 대상이 아니다
  for(const s of ALL.filter(s => ["table", "kana", "pinyin"].includes(s.type))) assert.equal(toQItems(s).length, 0, s.id);
});

test("문제마다 보기는 2~4개, 서로 다르고, 정답 위치가 맞다", () => {
  for(const sec of ALL.filter(quizzable)){
    for(let seed = 1; seed <= 5; seed++){
      const qs = buildQuiz(sec, { langs: englishOnly(sec) ? ["en"] : LANGS, tts: true, rng: seeded(seed) });
      assert.ok(qs.length >= Math.min(10, toQItems(sec).length) - 1, `${sec.id}: ${qs.length}문제`);
      for(const q of qs){
        assert.ok(q.choices.length >= 2 && q.choices.length <= 4, q.id);
        assert.equal(new Set(q.choices).size, q.choices.length, `${q.id}: 보기 중복`);
        const correct = q.type === "meaning" || q.type === "listen" ? q.source.ko
          : q.type === "foreign" ? q.source[q.lang].text : null;
        if(correct) assert.equal(q.choices[q.answer], correct, q.id);
      }
      // 한 세트 안에서 같은 항목이 두 번 나오지 않는다
      assert.equal(new Set(qs.map(q => q.item)).size, qs.length, sec.id);
    }
  }
});

test("빈칸 채우기: 개념 표의 문법 요소를 예문에서 비우고, 채우면 원문이 된다", () => {
  const tense = STAGES[1].sections.find(s => s.id === "s2-c-tense")!;
  const ja = markersOf(tense, "ja");
  assert.ok(ja.includes("食べました") && ja.includes("食べています"));
  assert.ok(!ja.some(m => /[가-힣]/.test(m)), "한글 설명은 제외");
  const cz = clozeFor("昨日ラーメンを食べました。", ja, "ja")!;
  assert.equal(cz.answer, "食べました");
  assert.equal(cz.prompt, `昨日ラーメンを${BLANK}。`);
  assert.ok(cz.pool.length >= 2 && !cz.pool.includes("食べました"));

  let made = 0;
  for(const sec of ALL.filter(s => s.type === "concept")){
    for(const lang of LANGS){
      const markers = markersOf(sec, lang);
      for(const it of toQItems(sec)){
        const c = clozeFor(it[lang].text, markers, lang);
        if(!c) continue;
        made++;
        assert.ok(c.prompt.includes(BLANK), `${sec.id}: ${c.prompt}`);
        assert.equal(c.prompt.replace(BLANK, c.answer).toLowerCase(), it[lang].text.toLowerCase(), `${sec.id}: 채우면 원문`);
      }
    }
  }
  assert.ok(made >= 30, `빈칸 문제 ${made}개`);
});

test("TTS가 없으면 듣기 문제를 내지 않고, 고른 언어로만 낸다", () => {
  const sec = STAGES[0].sections.find(s => s.id === "s1-greet")!;
  for(let seed = 1; seed <= 20; seed++){
    const qs = buildQuiz(sec, { langs: ["zh"], tts: false, rng: seeded(seed) });
    assert.ok(qs.every(q => q.type !== "listen" && q.lang === "zh"));
  }
  assert.deepEqual(buildQuiz(sec, { langs: [], tts: true }), []);
});

test("오답 노트: 틀리면 추가, 맞히면 제거하고, 오답만 다시 낼 수 있다", () => {
  const sec = STAGES[0].sections.find(s => s.id === "s1-food")!;
  let wrong: string[] = [];
  wrong = updateWrong(wrong, "s1-food:3:meaning:ja", false);
  wrong = updateWrong(wrong, "s1-food:3:meaning:ja", false);
  wrong = updateWrong(wrong, "s1-food:5:foreign:en", false);
  assert.deepEqual(wrong, ["s1-food:3:meaning:ja", "s1-food:5:foreign:en"]);
  const again = buildQuiz(sec, { langs: LANGS, tts: false, only: [...wrong, "s1-greet:0:meaning:ja"], rng: seeded(3) });
  assert.deepEqual(again.map(q => q.id), wrong);
  wrong = updateWrong(wrong, "s1-food:3:meaning:ja", true);
  assert.deepEqual(wrong, ["s1-food:5:foreign:en"]);
});

test("TOEIC: 표현 섹션은 영어로만, Part 5는 원래 보기와 정답·해설로 출제한다", () => {
  for(const sec of TOEIC.sections.filter(s => s.type === "toeic")){
    const qs = buildQuiz(sec, { langs: ["en"], tts: false, rng: seeded(7) });
    assert.ok(qs.length >= 10 && qs.every(q => q.lang === "en"), sec.id);
  }
  const p5 = TOEIC.sections.find(s => s.type === "problems")!;
  const qs = buildQuiz(p5, { langs: ["en"], tts: true, rng: seeded(2) });
  assert.equal(qs.length, 10);
  for(const q of qs){
    assert.equal(q.type, "part5");
    const [stem, choices, ans, exp] = (p5 as any).items[q.item];
    assert.deepEqual(q.choices, choices);
    assert.equal(q.answer, ans);
    assert.equal(q.explanation, exp);
    assert.equal(q.prompt.replace(BLANK, choices[ans]), stem.replace(/_{5,}/, choices[ans]));
  }
});
