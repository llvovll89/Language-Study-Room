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

/* v2.0: React용 토큰 트리 */
import { tokenizePron } from "../../lib/pron.mjs";
import { STAGES } from "../../data/index.js";

/* 토큰 트리를 renderPron과 같은 HTML로 되돌려 두 함수가 같은 의미인지 확인 */
const toHtml = nodes => nodes.map(n =>
  n.t === "text" ? esc(n.v) :
  n.t === "tone" ? `<sup class="tone t${n.d}" title="${n.name}">${n.mark}</sup>` :
  n.t === "link" ? '<span class="link" aria-hidden="true">‿</span>' :
  n.t === "pause" ? '<span class="pause" aria-hidden="true"></span>' :
  `<span class="${n.t}">${toHtml(n.c)}</span>`).join("");

test("tokenizePron: 높게·약하게는 자식을 가진 노드가 된다", () => {
  assert.deepEqual(tokenizePron("오[하요-] 데(스)", "ja"), [
    { t: "text", v: "오" }, { t: "hi", c: [{ t: "text", v: "하요-" }] },
    { t: "text", v: " 데" }, { t: "weak", c: [{ t: "text", v: "스" }] },
  ]);
});

test("tokenizePron: 성조는 zh에서만, 연음과 쉼도 노드가 된다", () => {
  assert.deepEqual(tokenizePron("니2", "zh"), [{ t: "text", v: "니" }, { t: "tone", d: 2, mark: "↗", name: "2성" }]);
  assert.deepEqual(tokenizePron("니2", "ja"), [{ t: "text", v: "니2" }]);
  assert.deepEqual(tokenizePron("A_B | C", "en"), [
    { t: "text", v: "A" }, { t: "link" }, { t: "text", v: "B " }, { t: "pause" }, { t: "text", v: " C" },
  ]);
});

test("tokenizePron은 모든 데이터에서 renderPron과 같은 결과를 낸다", () => {
  let n = 0;
  const check = (p, lang) => { if(!p) return; n++; assert.equal(toHtml(tokenizePron(p, lang)), renderPron(p, lang), p); };
  for(const st of STAGES) for(const sec of st.sections) for(const it of sec.items || []){
    if(sec.type === "dialog" || sec.type === "pattern"){ check(it[2][1], "ja"); check(it[3][2], "zh"); check(it[4][1], "en"); }
    else { check(it[1][2], "ja"); check(it[2][2], "zh"); check(it[3][1], "en"); }
  }
  assert.ok(n > 1500, `검사한 발음 수 ${n}`);
});
