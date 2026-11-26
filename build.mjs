/* 정적 HTML 빌드: node build.mjs → language-study.html
   모든 학습 내용을 HTML에 미리 렌더링해서 JS 없이도(아이폰 파일 미리보기, 오프라인) 볼 수 있게 한다 */
import { readFileSync, writeFileSync } from "node:fs";
import { STAGES, SEION, DAKUON, YOON } from "./data.js";

const here = new URL(".", import.meta.url);
const css = readFileSync(new URL("styles.css", here), "utf8");
const runtime = readFileSync(new URL("runtime.js", here), "utf8");
const OUT = new URL("language-study.html", here);

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const textKey = arr => esc(arr.join(" ").toLowerCase());
const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));

const BULB = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>';

const say = (text, lang, label) =>
  `<button class="say" type="button" data-say="${esc(text)}" data-lang="${lang}" aria-label="${label}"></button>`;

/* ───────── 셀 ───────── */
const koCell = ko => `<div class="cell ko" data-l="한국어" tabindex="0"><span class="txt">${esc(ko)}</span></div>`;
const jaCell = (ja, kana, pron) => {
  const body = kana ? `<ruby>${esc(ja)}<rt>${esc(kana)}</rt></ruby>` : esc(ja);
  return `<div class="cell ja" data-l="日本語" tabindex="0"><div class="cell-row"><span class="txt" lang="ja">${body}</span>${say(kana || ja, "ja-JP", "일본어 발음 듣기")}</div>${pron ? `<span class="pron">${esc(pron)}</span>` : ""}</div>`;
};
const enCell = en => `<div class="cell en" data-l="English" tabindex="0"><div class="cell-row"><span class="txt" lang="en">${esc(en)}</span>${say(en, "en-US", "영어 발음 듣기")}</div></div>`;
const colHead = dialog => `<div class="colhead${dialog ? " dlg" : ""}" aria-hidden="true">${dialog ? "<span>화자</span>" : ""}<span data-c="ko">한국어</span><span data-c="ja">日本語</span><span data-c="en">English</span></div>`;

/* ───────── 섹션 본문 ───────── */
const renderList = sec => colHead(false) + sec.items.map(it => {
  const [ko, ja, kana, pron, en] = it;
  return `<div class="entry" data-text="${textKey(it)}">${koCell(ko)}${jaCell(ja, kana, pron)}${enCell(en)}</div>`;
}).join("");

const renderDialog = sec => colHead(true) + sec.items.map(it => {
  const [who, ko, ja, pron, en] = it;
  return `<div class="entry dlg${who === "나" ? " me" : ""}" data-text="${textKey(it)}"><span class="who">${esc(who)}</span>${koCell(ko)}${jaCell(ja, "", pron)}${enCell(en)}</div>`;
}).join("");

const renderPattern = sec => sec.items.map(it => {
  const [pk, pj, pe, ko, ja, pron, en] = it;
  return `<div class="pat" data-text="${textKey(it)}"><div class="pat-top"><span class="tag ko">${esc(pk)}</span><span class="tag ja" lang="ja">${esc(pj)}</span><span class="tag en">${esc(pe)}</span></div><div class="entry">${koCell(ko)}${jaCell(ja, "", pron)}${enCell(en)}</div></div>`;
}).join("");

const renderTable = sec => {
  const jp = sec.head.map(h => /日本語|기본형|존경어|겸양어/.test(h));
  const head = sec.head.map(h => `<th scope="col">${esc(h)}</th>`).join("");
  const rows = sec.rows.map(r => `<tr data-text="${textKey(r)}">${r.map((v, i) =>
    `<td${jp[i] ? ' class="jp" lang="ja"' : ""} data-label="${esc(sec.head[i])}">${esc(v)}</td>`).join("")}</tr>`).join("");
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

const countOf = sec => sec.type === "kana" ? KANA_TOTAL : (sec.items || sec.rows).length;
const countItems = st => st.sections.reduce((n, s) => n + (s.type === "kana" ? 0 : countOf(s)), 0);

const renderSection = sec => {
  const [jp, en] = sec.sub.split(" / ");
  const total = countOf(sec);
  const body =
    sec.type === "kana" ? renderKana() :
    sec.type === "list" ? renderList(sec) :
    sec.type === "dialog" ? renderDialog(sec) :
    sec.type === "pattern" ? renderPattern(sec) :
    renderTable(sec);
  const note = sec.note ? `<div class="note">${BULB}<ul>${sec.note.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>` : "";
  const count = sec.type === "kana" ? `<span class="count">${total}자</span>` : `<span class="count" data-total="${total}">${total}개</span>`;
  return `<section class="sec" id="${sec.id}" data-type="${sec.type}" aria-labelledby="${sec.id}-h">
<header class="sec-h"><div><h3 id="${sec.id}-h">${esc(sec.title)}</h3><p class="sub"><span class="j" lang="ja">${esc(jp)}</span>${esc(en || "")}</p></div>${count}</header>
${note}${body}
</section>`;
};

const renderStage = st => `<div class="stage" id="stage-${st.id}" data-stage="${st.id}">
<div class="stage-head"><div class="stage-num" aria-hidden="true">${st.id}</div><div><h2><span class="sr-only">${st.id}단계 </span>${esc(st.name)}</h2><p>${esc(st.desc)}</p><p class="stage-meta">주제 ${st.sections.length}개, 표현 ${countItems(st)}개</p></div></div>
${st.sections.map(renderSection).join("\n")}
<div class="empty-state" hidden><strong></strong><span>다른 단계를 누르거나 검색어를 짧게 바꿔 보세요.</span></div>
</div>`;

const tocHtml = STAGES.map(st => `<div class="toc-group" data-stage="${st.id}"><p class="toc-title">${st.id}단계 주제</p>${st.sections.map(sec =>
  `<a href="#${sec.id}" data-for="${sec.id}">${esc(sec.title)}<span>${sec.type === "kana" ? `${countOf(sec)}자` : countOf(sec)}</span></a>`).join("")}</div>`).join("");

const stageNav = short => STAGES.map(st =>
  `<a href="#stage-${st.id}" data-stage-link="${st.id}" aria-label="${st.id}단계 ${esc(st.name)}"><b>${st.id}</b><span>${esc(short ? st.short : st.name)}</span></a>`).join("");

const html = `<!doctype html>
<html lang="ko" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#EEF1EC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#151A21" media="(prefers-color-scheme: dark)">
<title>세 언어 공부노트</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;700&family=Zen+Old+Mincho:wght@400;700&display=swap" rel="stylesheet">
<style>
${css}</style>
</head>
<body>

<header class="top">
  <div class="top-in">
    <a class="brand" href="#top" aria-label="세 언어 공부노트 맨 위로">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="brand-text">세 언어 공부노트</span>
    </a>
    <nav class="seg stage-seg" aria-label="학습 단계">${stageNav(false)}</nav>
    <div class="top-tools">
      <label class="search">
        <svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span class="sr-only">검색</span>
        <input id="q" type="search" placeholder="한국어, 日本語, English로 검색" autocomplete="off">
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
              <span class="view-label">가리기</span>
              <input class="sr-only hide-cb" type="checkbox" id="hide-ko"><label class="chip c-ko" for="hide-ko">한국어</label>
              <input class="sr-only hide-cb" type="checkbox" id="hide-ja"><label class="chip c-ja" for="hide-ja">日本語</label>
              <input class="sr-only hide-cb" type="checkbox" id="hide-en"><label class="chip c-en" for="hide-en">English</label>
            </div>
            <div class="view-group">
              <span class="view-label">일본어</span>
              <input class="sr-only" type="checkbox" id="show-pron" checked><label class="chip" for="show-pron">발음과 후리가나 표시</label>
            </div>
            <p class="view-hint">가린 칸을 누르면 그 칸만 보입니다.</p>
          </div>
        </div>
      </details>
    </div>
  </div>
</header>

<section class="hero" id="top">
  <div>
    <h1>한 문장을<br>세 언어로 익힙니다</h1>
    <p class="hero-lead">한국어로 뜻을 잡고, 같은 말을 일본어와 영어로 바로 옆에서 비교합니다. 인사와 기초 단어부터 비즈니스, 개발 현장 표현까지 세 단계로 나눴습니다.</p>
    <div class="sample" aria-label="예시 문장">
      <div class="sample-row ko"><span>한국어</span><p>잘 부탁드립니다</p></div>
      <div class="sample-row ja"><span>日本語</span><p lang="ja">よろしくお願いします<small>요로시쿠 오네가이시마스</small></p></div>
      <div class="sample-row en"><span>English</span><p>I look forward to working with you.</p></div>
    </div>
  </div>
  <div class="glyphs" aria-hidden="true">
    <figure class="glyph g-ko">가<figcaption>한국어</figcaption></figure>
    <figure class="glyph g-ja">あ<figcaption>日本語</figcaption></figure>
    <figure class="glyph g-en">A<figcaption>English</figcaption></figure>
  </div>
</section>

<div class="layout" id="layout">
  <nav class="toc" id="toc" aria-label="주제 목록">${tocHtml}</nav>
  <main id="main">
${STAGES.map(renderStage).join("\n")}
  </main>
</div>

<footer>인터넷 없이도 모든 내용을 볼 수 있습니다. 발음 듣기와 검색은 Safari나 Chrome으로 열었을 때 동작합니다.</footer>

<nav class="tabbar" aria-label="학습 단계">${stageNav(true)}</nav>

<script>
${runtime}</script>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`built ${OUT.pathname} (${(html.length / 1024).toFixed(0)} KB)`);
