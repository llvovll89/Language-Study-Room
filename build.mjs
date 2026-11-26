/* 정적 HTML 빌드: node build.mjs → language-study.html
   모든 학습 내용을 HTML에 미리 렌더링해서 JS 없이도(아이폰 파일 미리보기, 오프라인) 볼 수 있게 한다 */
import { readFileSync, writeFileSync } from "node:fs";
import { STAGES, SEION, DAKUON, YOON, PINYIN } from "./data/index.js";
import { esc, renderPron, plainPron, plainPinyin } from "./lib/pron.mjs";

const here = new URL(".", import.meta.url);
const css = readFileSync(new URL("styles.css", here), "utf8");
const runtime = readFileSync(new URL("runtime.js", here), "utf8");
const { version } = JSON.parse(readFileSync(new URL("package.json", here), "utf8"));
// patch가 0이면 vX.Y, 아니면 vX.Y.Z
const [maj, min, patch] = version.split(".");
const VERSION = `v${maj}.${min}${patch !== "0" ? "." + patch : ""}`;
const OUT = new URL("language-study.html", here);

const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));

const textKey = parts => esc(parts.filter(Boolean).join(" ").toLowerCase());

const BULB = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>';

const say = (text, lang, label) =>
  `<button class="say" type="button" data-say="${esc(text)}" data-lang="${lang}" aria-label="${label}"></button>`;

/* ───────── 셀 ───────── */
const LANGS = [["ko", "한국어"], ["ja", "日本語"], ["zh", "中文"], ["en", "English"]];
const pronHtml = (pron, lang) => pron ? `<span class="pron">${renderPron(pron, lang)}</span>` : "";
const koCell = ko => `<div class="cell ko" data-l="한국어" tabindex="0"><span class="txt">${esc(ko)}</span></div>`;
const jaCell = ([ja, kana, pron]) => {
  const body = kana ? `<ruby>${esc(ja)}<rt>${esc(kana)}</rt></ruby>` : esc(ja);
  return `<div class="cell ja" data-l="日本語" tabindex="0"><div class="cell-row"><span class="txt" lang="ja">${body}</span>${say(kana || ja, "ja-JP", "일본어 발음 듣기")}</div>${pronHtml(pron, "ja")}</div>`;
};
const zhCell = ([zh, py, pron]) =>
  `<div class="cell zh" data-l="中文" tabindex="0"><div class="cell-row"><span class="txt" lang="zh-CN">${esc(zh)}</span>${say(zh, "zh-CN", "중국어 발음 듣기")}</div>${py ? `<span class="py" lang="zh-Latn-pinyin">${esc(py)}</span>` : ""}${pronHtml(pron, "zh")}</div>`;
const enCell = ([en, pron]) =>
  `<div class="cell en" data-l="English" tabindex="0"><div class="cell-row"><span class="txt" lang="en">${esc(en)}</span>${say(en, "en-US", "영어 발음 듣기")}</div>${pronHtml(pron, "en")}</div>`;
const langCells = (ja, zh, en) => jaCell(ja) + zhCell(zh) + enCell(en);
const colHead = dialog => `<div class="colhead${dialog ? " dlg" : ""}" aria-hidden="true">${dialog ? "<span>화자</span>" : ""}${LANGS.map(([c, n]) => `<span data-c="${c}">${n}</span>`).join("")}</div>`;

/* 검색 키 */
const langKey = ([ja, kana, jp], [zh, py, zp], [en, ep]) =>
  [ja, kana, plainPron(jp || "", "ja"), zh, py && plainPinyin(py), plainPron(zp || "", "zh"), en, plainPron(ep || "", "en")];

/* ───────── 섹션 본문 ───────── */
const renderList = sec => colHead(false) + sec.items.map(([ko, ja, zh, en]) =>
  `<div class="entry" data-text="${textKey([ko, ...langKey(ja, zh, en)])}">${koCell(ko)}${langCells(ja, zh, en)}</div>`).join("");

const renderDialog = sec => colHead(true) + sec.items.map(([who, ko, [ja, jp], zh, en]) =>
  `<div class="entry dlg${who === "나" ? " me" : ""}" data-text="${textKey([who, ko, ...langKey([ja, "", jp], zh, en)])}"><span class="who">${esc(who)}</span>${koCell(ko)}${langCells([ja, "", jp], zh, en)}</div>`).join("");

const renderPattern = sec => sec.items.map(([[pk, pj, pz, pe], ko, [ja, jp], zh, en]) =>
  `<div class="pat" data-text="${textKey([pk, pj, pz, pe, ko, ...langKey([ja, "", jp], zh, en)])}"><div class="pat-top"><span class="tag ko">${esc(pk)}</span><span class="tag ja" lang="ja">${esc(pj)}</span><span class="tag zh" lang="zh-CN">${esc(pz)}</span><span class="tag en">${esc(pe)}</span></div><div class="entry">${koCell(ko)}${langCells([ja, "", jp], zh, en)}</div></div>`).join("");

/* 표 열의 언어 판별 → 언어 class (글꼴, 언어 표시 토글에 사용) */
const colLang = h => h === "한국어" ? "ko" : /日本語|기본형|존경어|겸양어/.test(h) ? "ja" : h === "中文" ? "zh" : h === "English" ? "en" : "";
const HTML_LANG = { ja: "ja", zh: "zh-CN", en: "en" };
const renderTable = sec => {
  const langs = sec.head.map(colLang);
  const cls = i => langs[i] ? ` class="l-${langs[i]}"` : "";
  const head = sec.head.map((h, i) => `<th scope="col"${cls(i)}>${esc(h)}</th>`).join("");
  const rows = sec.rows.map(r => {
    const flat = r.map(v => Array.isArray(v) ? v[0] : v);
    return `<tr data-text="${textKey(flat)}">${r.map((v, i) => {
      const [txt, pron] = Array.isArray(v) ? v : [v, ""];
      const lang = HTML_LANG[langs[i]] ? ` lang="${HTML_LANG[langs[i]]}"` : "";
      return `<td${cls(i)}${lang} data-label="${esc(sec.head[i])}">${esc(txt)}${pronHtml(pron, langs[i])}</td>`;
    }).join("")}</tr>`;
  }).join("");
  return `<div class="tbl-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
};

const kanaGrid = (list, cols, kata) => `<div class="kana-grid${cols === 3 ? " y3" : ""}">${list.map(k => {
  if(!k) return `<div class="k empty"></div>`;
  const ch = kata ? toKata(k[0]) : k[0];
  return `<button class="k" type="button" data-say="${esc(k[0])}" data-lang="ja-JP" aria-label="${esc(ch)}, ${esc(k[2])}"><b lang="ja">${esc(ch)}</b><span>${esc(k[2])} ${esc(k[1])}</span></button>`;
}).join("")}</div>`;

const KANA_GROUPS = [["기본 글자 46자 (청음)", SEION, 5], ["점과 동그라미가 붙는 글자 (탁음, 반탁음)", DAKUON, 5], ["작은 ゃ ゅ ょ 조합 (요음)", YOON, 3]];
const KANA_TOTAL = SEION.filter(Boolean).length + DAKUON.length + YOON.length;
const renderKana = () => {
  const set = kata => `<div class="kana-set ${kata ? "kata" : "hira"}">${KANA_GROUPS.map(([h, list, cols]) =>
    `<div class="kana-group"><h4>${h}</h4>${kanaGrid(list, cols, kata)}</div>`).join("")}</div>`;
  return `<div class="seg kana-switch" role="radiogroup" aria-label="글자 종류">
<input class="sr-only" type="radio" name="kana" id="kana-hira" checked><label for="kana-hira">ひらがな 히라가나</label>
<input class="sr-only" type="radio" name="kana" id="kana-kata"><label for="kana-kata">カタカナ 가타카나</label>
</div>${set(false)}${set(true)}`;
};

/* 병음표: 누르면 예시 한자를 중국어로 읽는다 */
const PINYIN_TOTAL = PINYIN.tones.length + PINYIN.initials.length + PINYIN.finals.length;
const pyGrid = list => `<div class="kana-grid py-grid">${list.map(([p, ko, ch, chPy]) =>
  `<button class="k" type="button" data-say="${esc(ch)}" data-lang="zh-CN" aria-label="${esc(p)}, ${esc(ko)}, 예: ${esc(ch)} ${esc(chPy)}"><b lang="zh-Latn-pinyin">${esc(p)}</b><span>${esc(ko)}</span><span class="ex"><i lang="zh-CN">${esc(ch)}</i> ${esc(chPy)}</span></button>`).join("")}</div>`;
const renderPinyin = () => `<div class="kana-group"><h4>성조 4개와 경성 (같은 ma도 높낮이에 따라 뜻이 다릅니다)</h4>
<div class="kana-grid tone-grid">${PINYIN.tones.map(([ch, py, , pron, desc]) =>
  `<button class="k" type="button" data-say="${esc(ch)}" data-lang="zh-CN" aria-label="${esc(ch)} ${esc(py)}, ${esc(desc)}"><b lang="zh-CN">${esc(ch)}</b><span lang="zh-Latn-pinyin">${esc(py)}</span><span class="pron">${renderPron(pron, "zh")}</span><span class="desc">${esc(desc)}</span></button>`).join("")}</div></div>
<div class="kana-group"><h4>성모 (첫소리)</h4>${pyGrid(PINYIN.initials)}</div>
<div class="kana-group"><h4>운모 (모음 부분)</h4>${pyGrid(PINYIN.finals)}</div>`;

/* 특정 언어 전용 섹션: 해당 언어를 끄면 섹션도 숨긴다 */
const SEC_LANG = { kana: "ja", pinyin: "zh" };
const isChart = sec => sec.type in SEC_LANG;
const countOf = sec => sec.type === "kana" ? KANA_TOTAL : sec.type === "pinyin" ? PINYIN_TOTAL : (sec.items || sec.rows).length;
const countItems = st => st.sections.reduce((n, s) => n + (isChart(s) ? 0 : countOf(s)), 0);
const unit = sec => isChart(sec) ? "자" : "개";

const renderSection = sec => {
  const [jp, zh, en] = sec.sub.split(" / ");
  const total = countOf(sec);
  const body =
    sec.type === "kana" ? renderKana() :
    sec.type === "pinyin" ? renderPinyin() :
    sec.type === "list" ? renderList(sec) :
    sec.type === "dialog" ? renderDialog(sec) :
    sec.type === "pattern" ? renderPattern(sec) :
    renderTable(sec);
  const note = sec.note ? `<div class="note">${BULB}<ul>${sec.note.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>` : "";
  const count = isChart(sec) ? `<span class="count">${total}${unit(sec)}</span>` : `<span class="count" data-total="${total}">${total}개</span>`;
  const secLang = SEC_LANG[sec.type] ? ` data-lang="${SEC_LANG[sec.type]}"` : "";
  return `<section class="sec" id="${sec.id}" data-type="${sec.type}"${secLang} aria-labelledby="${sec.id}-h">
<header class="sec-h"><div><h3 id="${sec.id}-h">${esc(sec.title)}</h3><p class="sub"><span class="j" lang="ja">${esc(jp)}</span>${zh ? `<span class="z" lang="zh-CN">${esc(zh)}</span>` : ""}${esc(en || "")}</p></div>${count}</header>
${note}${body}
</section>`;
};

const renderStage = st => `<div class="stage" id="stage-${st.id}" data-stage="${st.id}">
<div class="stage-head"><div class="stage-num" aria-hidden="true">${st.id}</div><div><h2><span class="sr-only">${st.id}단계 </span>${esc(st.name)}</h2><p>${esc(st.desc)}</p><p class="stage-meta">주제 ${st.sections.length}개, 표현 ${countItems(st)}개</p></div></div>
${st.sections.map(renderSection).join("\n")}
<div class="empty-state" hidden><strong></strong><span>다른 단계를 누르거나 검색어를 짧게 바꿔 보세요.</span></div>
</div>`;

const tocHtml = STAGES.map(st => `<div class="toc-group" data-stage="${st.id}"><p class="toc-title">${st.id}단계 주제</p>${st.sections.map(sec =>
  `<a href="#${sec.id}" data-for="${sec.id}"${SEC_LANG[sec.type] ? ` data-lang="${SEC_LANG[sec.type]}"` : ""}>${esc(sec.title)}<span>${isChart(sec) ? `${countOf(sec)}자` : countOf(sec)}</span></a>`).join("")}</div>`).join("");

const stageNav = short => STAGES.map(st =>
  `<a href="#stage-${st.id}" data-stage-link="${st.id}" aria-label="${st.id}단계 ${esc(st.name)}"><b>${st.id}</b><span>${esc(short ? st.short : st.name)}</span></a>`).join("");

const html = `<!doctype html>
<html lang="ko" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#EEF1EC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#151A21" media="(prefers-color-scheme: dark)">
<title>네 언어 공부노트</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;700&family=Noto+Serif+SC:wght@400;700&family=Zen+Old+Mincho:wght@400;700&display=swap" rel="stylesheet">
<style>
${css}</style>
</head>
<body>

<header class="top">
  <div class="top-in">
    <a class="brand" href="#top" aria-label="네 언어 공부노트 맨 위로">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="brand-text">네 언어 공부노트</span>
    </a>
    <nav class="seg stage-seg" aria-label="학습 단계">${stageNav(false)}</nav>
    <div class="top-tools">
      <label class="search">
        <svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span class="sr-only">검색</span>
        <input id="q" type="search" placeholder="한국어, 日本語, 中文, English, 병음으로 검색" autocomplete="off">
      </label>
      <details class="view">
        <summary class="icon-btn" aria-label="보기 설정">
          <svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>
          <span class="lbl">보기 설정</span>
          <span class="dot" aria-hidden="true"></span>
        </summary>
        <div class="view-panel">
          <div class="view-in">
            <div class="view-group">
              <span class="view-label">공부할 언어</span>
              <input class="sr-only show-cb" type="checkbox" id="show-ja" checked><label class="chip c-ja" for="show-ja">日本語</label>
              <input class="sr-only show-cb" type="checkbox" id="show-zh" checked><label class="chip c-zh" for="show-zh">中文</label>
              <input class="sr-only show-cb" type="checkbox" id="show-en" checked><label class="chip c-en" for="show-en">English</label>
            </div>
            <div class="view-group">
              <span class="view-label">가리기</span>
              <input class="sr-only hide-cb" type="checkbox" id="hide-ko"><label class="chip c-ko" for="hide-ko">한국어</label>
              <input class="sr-only hide-cb" type="checkbox" id="hide-ja"><label class="chip c-ja" for="hide-ja">日本語</label>
              <input class="sr-only hide-cb" type="checkbox" id="hide-zh"><label class="chip c-zh" for="hide-zh">中文</label>
              <input class="sr-only hide-cb" type="checkbox" id="hide-en"><label class="chip c-en" for="hide-en">English</label>
            </div>
            <div class="view-group">
              <span class="view-label">발음</span>
              <input class="sr-only" type="checkbox" id="show-pron" checked><label class="chip" for="show-pron">발음 표시 (후리가나·병음·한글 발음)</label>
            </div>
            <p class="view-hint">가린 칸을 누르면 그 칸만 보입니다. 한글 발음의 <b class="hi-demo">굵은 윗줄</b>은 높게·세게, 화살표는 중국어 성조입니다.</p>
          </div>
        </div>
      </details>
    </div>
  </div>
</header>

<section class="hero" id="top">
  <div>
    <h1>한 문장을<br>네 언어로 익힙니다</h1>
    <p class="hero-lead">한국어로 뜻을 잡고, 같은 말을 일본어, 중국어, 영어로 바로 옆에서 비교합니다. 외국어를 처음 배우는 분도 읽을 수 있게 모든 문장에 한글 발음과 높낮이를 붙였습니다.</p>
    <div class="sample" aria-label="예시 문장">
      <div class="sample-row ko"><span>한국어</span><p>잘 부탁드립니다</p></div>
      <div class="sample-row ja"><span>日本語</span><p lang="ja">よろしくお願いします<small>${renderPron("요[로시]쿠 오[네가이시마](스)", "ja")}</small></p></div>
      <div class="sample-row zh"><span>中文</span><p lang="zh-CN">请多关照<small>${renderPron("칭3 뚜오1 꽌1 짜오4", "zh")}</small></p></div>
      <div class="sample-row en"><span>English</span><p>I look forward to working with you.<small>${renderPron("(아이) [룩] [포]워드 (투) [워]킹 (위드) 유", "en")}</small></p></div>
    </div>
  </div>
  <div class="glyphs" aria-hidden="true">
    <figure class="glyph g-ko">가<figcaption>한국어</figcaption></figure>
    <figure class="glyph g-ja">あ<figcaption>日本語</figcaption></figure>
    <figure class="glyph g-zh">中<figcaption>中文</figcaption></figure>
    <figure class="glyph g-en">A<figcaption>English</figcaption></figure>
  </div>
</section>

<div class="layout" id="layout">
  <nav class="toc" id="toc" aria-label="주제 목록">${tocHtml}</nav>
  <main id="main">
${STAGES.map(renderStage).join("\n")}
  </main>
</div>

<footer>인터넷 없이도 모든 내용을 볼 수 있습니다. 발음 듣기와 검색은 Safari나 Chrome으로 열었을 때 동작합니다. <span class="ver">${VERSION}</span></footer>

<nav class="tabbar" aria-label="학습 단계">${stageNav(true)}</nav>

<script>
${runtime}</script>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`built ${OUT.pathname} ${VERSION} (${(html.length / 1024).toFixed(0)} KB)`);
