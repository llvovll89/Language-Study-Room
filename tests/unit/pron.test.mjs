/* 한글 발음 표기 변환 단위 테스트: node --test tests/unit */
import { test } from "node:test";
import assert from "node:assert/strict";
import { esc, renderPron, plainPron, plainPinyin, TONES } from "../../lib/pron.mjs";

test("[ ]는 높게·세게(.hi), ( )는 약하게(.weak)로 바뀐다", () => {
  assert.equal(renderPron("오[하요-]", "ja"), '오<span class="hi">하요-</span>');
  assert.equal(renderPron("데(스)", "ja"), '데<span class="weak">스</span>');
});

test("_는 연음 기호, |는 쉼 표시로 바뀐다", () => {
  assert.match(renderPron("체크_아웃", "en"), /체크<span class="link" aria-hidden="true">‿<\/span>아웃/);
  assert.equal(renderPron("A | B", "ja"), 'A <span class="pause" aria-hidden="true"></span> B');
});

test("성조 숫자는 중국어에서만 화살표가 된다", () => {
  const zh = renderPron("니2 하오3", "zh");
  assert.match(zh, /니<sup class="tone t2" title="2성">↗<\/sup>/);
  assert.match(zh, /하오<sup class="tone t3" title="3성">↘↗<\/sup>/);
  assert.equal(renderPron("니2", "ja"), "니2");
  assert.equal(Object.keys(TONES).length, 5);
});

test("경성 0도 표시된다", () => {
  assert.match(renderPron("시에4 시에0", "zh"), /<sup class="tone t0" title="경성">·<\/sup>/);
});

test("HTML 특수문자는 escape된다 (XSS 방지)", () => {
  assert.equal(esc('<a href="x">&'), "&lt;a href=&quot;x&quot;&gt;&amp;");
  const out = renderPron("<img src=x onerror=alert(1)>", "en");
  assert.ok(!out.includes("<img"), out);
});

test("검색용 발음은 표기 기호와 성조 숫자가 빠진다", () => {
  assert.equal(plainPron("오[하요-] 고[자이마](스)", "ja"), "오하요- 고자이마스");
  assert.equal(plainPron("니2 하오3", "zh"), "니 하오");
  assert.equal(plainPron("[땡]_큐 | 쏘 머치", "en"), "땡큐  쏘 머치");
  // 중국어가 아니면 숫자를 지우지 않는다
  assert.equal(plainPron("10", "ja"), "10");
});

test("병음은 성조 기호 없이, 붙여서, ü는 u와 v로도 찾을 수 있다", () => {
  const key = plainPinyin("xiè xie");
  for(const f of ["xiè xie", "xie xie", "xiexie"]) assert.ok(key.includes(f), f);
  const lv = plainPinyin("lǜ chá");
  for(const f of ["lu cha", "lucha", "lv cha", "lvcha"]) assert.ok(lv.includes(f), f);
});
