/* 데이터 구조 단위 테스트: node --test tests/unit */
import { test } from "node:test";
import assert from "node:assert/strict";
import { STAGES, SEION, DAKUON, YOON, PINYIN } from "../../data/index.js";

const sections = STAGES.flatMap(st => st.sections.map(sec => ({ st, sec })));
const TYPES = ["list", "dialog", "pattern", "table", "concept", "kana", "pinyin"];

test("단계는 1, 2, 3 순서이고 이름과 설명이 있다", () => {
  assert.deepEqual(STAGES.map(s => s.id), [1, 2, 3]);
  for(const st of STAGES){
    assert.ok(st.name && st.short && st.desc, `${st.id}단계`);
    assert.ok(st.sections.length > 0);
  }
});

test("섹션 id는 전체에서 유일하고 단계 번호로 시작한다", () => {
  const ids = sections.map(({ sec }) => sec.id);
  assert.equal(new Set(ids).size, ids.length, "중복 id");
  for(const { st, sec } of sections) assert.match(sec.id, new RegExp(`^s${st.id}-[a-z0-9-]+$`));
});

test("섹션 type은 정해진 것만 쓴다", () => {
  for(const { sec } of sections) assert.ok(TYPES.includes(sec.type), `${sec.id}: ${sec.type}`);
});

test("발음 범례와 병음표는 1단계에 있다", () => {
  const s1 = STAGES[0].sections.map(s => s.id);
  assert.equal(s1[0], "s1-pron-guide");
  assert.ok(s1.indexOf("s1-pinyin") === s1.indexOf("s1-kana") + 1, "병음표는 가나표 바로 뒤");
});

test("중국어 칸은 간체 한자를 쓴다 (번체 글자가 섞이지 않는다)", () => {
  // 번체에서만 쓰는 대표 글자 (간체 데이터에 섞이면 안 됨)
  const TRAD = /[們這說話時間還來對機會門問題麼東車長開關學電後裡體點國]/;
  for(const { sec } of sections){
    for(const it of sec.items || []){
      const zh = sec.type === "list" ? it[2] : it[3];
      assert.ok(!TRAD.test(zh[0]), `${sec.id}: 번체 의심 ${zh[0]}`);
    }
  }
});

test("예문에 실제 개인 이름 대신 가상 이름을 쓴다", () => {
  const all = JSON.stringify(STAGES);
  for(const banned of ["건호", "ゴンホ", "Geonho", "建浩"]) assert.ok(!all.includes(banned), banned);
});

test("가나표와 병음표 개수", () => {
  assert.equal(SEION.filter(Boolean).length, 46);
  assert.ok(DAKUON.length > 0 && YOON.length > 0);
  assert.equal(PINYIN.tones.length, 5);
  assert.deepEqual(PINYIN.tones.map(t => t[2]), [1, 2, 3, 4, 0]);
  assert.equal(PINYIN.initials.length, 21);
});

/* v1.2: 기본/중급/심화 구성 */
test("단계 이름은 기본, 중급, 심화이다", () => {
  assert.deepEqual(STAGES.map(s => s.short), ["기본", "중급", "심화"]);
});

test("단계마다 개념 섹션이 단어·회화보다 먼저 나온다", () => {
  const isConcept = s => s.type === "concept" || s.concept === true;
  const chart = s => s.type === "kana" || s.type === "pinyin";
  for(const st of STAGES){
    const body = st.sections.filter(s => !chart(s));
    const firstNon = body.findIndex(s => !isConcept(s));
    assert.ok(firstNon > 0, `${st.short}: 개념 섹션이 맨 앞에 없음`);
    assert.ok(body.slice(firstNon).every(s => !isConcept(s)), `${st.short}: 개념 섹션이 중간에 섞임`);
    assert.ok(st.sections.filter(s => s.type === "concept").length >= 4, `${st.short}: 새 개념 섹션 4개 이상`);
  }
});

test("개념 섹션은 비교 표와 예문 3개 이상을 가진다", () => {
  for(const { sec } of sections.filter(({ sec }) => sec.type === "concept")){
    assert.ok(sec.head && sec.rows.length >= 3, `${sec.id}: 비교 표`);
    assert.ok(sec.items.length >= 3, `${sec.id}: 예문`);
    assert.ok(sec.note && sec.note.length >= 2, `${sec.id}: 설명`);
  }
});

test("기본 단어 섹션은 20개, 심화 상황 섹션은 12개 이상이다", () => {
  for(const sec of STAGES[0].sections.filter(s => s.type === "list")) assert.ok(sec.items.length >= 20, `${sec.id}: ${sec.items.length}`);
  for(const sec of STAGES[2].sections.filter(s => s.type === "list")) assert.ok(sec.items.length >= 12, `${sec.id}: ${sec.items.length}`);
});

test("같은 단계 안에서 같은 한국어 항목이 두 번 나오지 않는다", () => {
  for(const st of STAGES){
    const kos = st.sections.filter(s => s.type === "list").flatMap(s => s.items.map(it => it[0]));
    const dup = kos.filter((k, i) => kos.indexOf(k) !== i);
    assert.deepEqual(dup, [], `${st.short}`);
  }
});

/* v2.1: 여행 탭 (웹앱 전용) */
import { TRAVEL } from "../../data/index.js";

test("여행 탭: id 4, 보여 주기 카드가 맨 앞, 장면 섹션은 12개 이상", () => {
  assert.equal(TRAVEL.id, 4);
  assert.equal(TRAVEL.short, "여행");
  assert.equal(TRAVEL.sections[0].type, "card");
  assert.ok(TRAVEL.sections[0].items.length >= 20, "보여 주기 카드 20개 이상");
  for(const sec of TRAVEL.sections){
    assert.match(sec.id, /^t-[a-z-]+$/);
    assert.ok(["list", "card"].includes(sec.type), `${sec.id}: ${sec.type}`);
    assert.ok(sec.items.length >= 12, `${sec.id}: ${sec.items.length}`);
    assert.ok(sec.note && sec.note.length >= 2, `${sec.id}: 설명`);
  }
});

test("여행 탭 섹션 id는 학습 단계와 겹치지 않고, 같은 한국어 항목이 두 번 나오지 않는다", () => {
  const stageIds = new Set(STAGES.flatMap(st => st.sections.map(s => s.id)));
  for(const sec of TRAVEL.sections) assert.ok(!stageIds.has(sec.id), sec.id);
  const kos = TRAVEL.sections.flatMap(s => s.items.map(it => it[0]));
  assert.deepEqual(kos.filter((k, i) => kos.indexOf(k) !== i), []);
});

/* v2.3: TOEIC 탭 (웹앱 전용, 영어만) */
import { TOEIC } from "../../data/index.js";

test("TOEIC 탭: id 5, 시험 구성 표가 맨 앞이고 공식 문항 수 합계가 200이다", () => {
  assert.equal(TOEIC.id, 5);
  assert.equal(TOEIC.short, "TOEIC");
  const about = TOEIC.sections[0];
  assert.equal(about.id, "e-about");
  const parts = about.rows.filter(r => /^Part [1-7]$/.test(r[0]));
  assert.equal(parts.length, 7);
  // YBM 공식: 6 + 25 + 39 + 30 + 30 + 16 + 54 = 200
  assert.deepEqual(parts.map(r => Number(r[2])), [6, 25, 39, 30, 30, 16, 54]);
  assert.equal(parts.reduce((n, r) => n + Number(r[2]), 0), 200);
});

test("TOEIC 탭: 섹션 id는 e-로 시작하고, 표현·문제 섹션이 충분하다", () => {
  for(const sec of TOEIC.sections){
    assert.match(sec.id, /^e-[a-z0-9-]+$/);
    assert.ok(["table", "toeic", "problems"].includes(sec.type), `${sec.id}: ${sec.type}`);
  }
  assert.ok(TOEIC.sections.filter(s => s.type === "toeic").length >= 10);
  const p5 = TOEIC.sections.find(s => s.type === "problems");
  assert.ok(p5 && p5.items.length >= 20);
});

test("TOEIC Part 5 문제: 정답 위치가 한쪽에 몰리지 않고, 같은 문제가 없다", () => {
  const p5 = TOEIC.sections.find(s => s.type === "problems");
  const pos = [0, 0, 0, 0];
  for(const [, , ans] of p5.items) pos[ans]++;
  for(const n of pos) assert.ok(n >= 3, `정답 위치 분포 ${pos}`);
  const stems = p5.items.map(it => it[0]);
  assert.equal(new Set(stems).size, stems.length);
});

test("TOEIC 표현은 전체에서 중복되지 않는다", () => {
  const ens = TOEIC.sections.filter(s => s.type === "toeic").flatMap(s => s.items.map(it => it[0].toLowerCase()));
  assert.deepEqual(ens.filter((e, i) => ens.indexOf(e) !== i), []);
});
