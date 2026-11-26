/* 데이터 구조 단위 테스트: node --test tests/unit */
import { test } from "node:test";
import assert from "node:assert/strict";
import { STAGES, SEION, DAKUON, YOON, PINYIN } from "../../data/index.js";

const sections = STAGES.flatMap(st => st.sections.map(sec => ({ st, sec })));
const TYPES = ["list", "dialog", "pattern", "table", "kana", "pinyin"];

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
