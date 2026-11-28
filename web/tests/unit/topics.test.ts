/* 주제 페이지 주소와 진도 단위 테스트 (v2.4): node --test web/tests/unit (Node 22 type stripping) */
import { test } from "node:test";
import assert from "node:assert/strict";
import { STAGES, TOEIC, TRAVEL } from "../../../data/index.js";
import { addDone, allPaths, lastInStage, readDone, SLUGS, topicPath, topicSlug } from "../../app/lib/topics.ts";

const ALL = [...STAGES, TRAVEL, TOEIC];

test("주제 주소는 섹션 id에서 단계 접두어를 뗀 것이다", () => {
  assert.equal(topicSlug("s1-greet"), "greet");
  assert.equal(topicSlug("s2-c-tense"), "c-tense");
  assert.equal(topicSlug("t-airport"), "airport");
  assert.equal(topicSlug("e-part5"), "part5");
  assert.equal(topicPath("basic", "s1-greet"), "/basic/greet");
});

test("주제 주소는 단계 안에서 겹치지 않고 주소에 쓸 수 있는 글자만 쓴다", () => {
  ALL.forEach((st, i) => {
    const slugs = st.sections.map(s => topicSlug(s.id));
    assert.equal(new Set(slugs).size, slugs.length, SLUGS[i]);
    for(const s of slugs) assert.match(s, /^[a-z0-9][a-z0-9-]*$/);
  });
});

test("prerender 목록에 홈, 단계 5개, 모든 주제가 한 번씩 있다", () => {
  const paths = allPaths(ALL);
  const topics = ALL.reduce((n, st) => n + st.sections.length, 0);
  assert.equal(paths.length, 1 + SLUGS.length + topics);
  assert.equal(new Set(paths).size, paths.length);
  for(const slug of SLUGS) assert.ok(paths.includes(`/${slug}`), slug);
  assert.ok(paths.includes("/basic/greet"));
  assert.ok(paths.includes("/toeic/part5"));
});

test("주제 묶음(parts)은 모든 섹션을 순서대로 빠짐없이 나눈다", () => {
  for(const st of ALL){
    const starts = st.parts.map(p => st.sections.findIndex(s => s.id === p.from));
    assert.equal(starts[0], 0, `${st.id}: 첫 묶음`);
    starts.forEach((at, i) => { if(i) assert.ok(at > starts[i - 1], `${st.id}: ${st.parts[i].from}`); });
  }
});

test("완료 목록: 잘못된 저장값은 빈 목록, 같은 주제는 한 번만", () => {
  assert.deepEqual(readDone(() => null), []);
  assert.deepEqual(readDone(() => "{broken"), []);
  assert.deepEqual(readDone(() => '{"a":1}'), []);
  assert.deepEqual(readDone(() => '["s1-greet", 3]'), ["s1-greet"]);
  const once = addDone([], "s1-greet");
  assert.deepEqual(once, ["s1-greet"]);
  assert.equal(addDone(once, "s1-greet"), once, "이미 있으면 같은 배열 (저장 생략)");
});

test("이어 보기: 그 단계의 올바른 주제 주소일 때만", () => {
  assert.equal(lastInStage("/basic/greet", "basic"), "/basic/greet");
  assert.equal(lastInStage("/advanced/dev", "basic"), null);
  assert.equal(lastInStage("/basic", "basic"), null);
  assert.equal(lastInStage("/basic/../x", "basic"), null);
  assert.equal(lastInStage(null, "basic"), null);
});
