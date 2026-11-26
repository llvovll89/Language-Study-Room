/* JS가 있을 때만 붙는 기능: 단계 하나씩 보기, 검색, 발음 듣기, 목차 위치 표시, 공부할 언어 기억
   JS 없이 열면(아이폰 파일 미리보기 등) 정적 HTML과 CSS만으로 전체 내용이 보인다 */
const root = document.documentElement;
root.classList.remove("no-js");

const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
};

/* JS 모드에서는 칸 focus가 필요 없으므로 tab 순서에서 제거 */
document.querySelectorAll(".cell[tabindex]").forEach(c => c.removeAttribute("tabindex"));

/* ───────── 발음 듣기 ───────── */
const canSpeak = "speechSynthesis" in window;
if(!canSpeak) root.classList.add("no-tts");
const speak = (text, lang) => {
  if(!canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[～~○]/g, ""));
  u.lang = lang;
  u.rate = lang === "en-US" ? 0.9 : 0.85;
  speechSynthesis.speak(u);
};

/* ───────── 단계 전환 ───────── */
const stages = [...document.querySelectorAll(".stage")];
const tocGroups = [...document.querySelectorAll(".toc-group")];
const stageLinks = [...document.querySelectorAll("[data-stage-link]")];
const layout = document.getElementById("layout");
const topBar = document.querySelector(".top");

let current = Number(store.get("tri.stage")) || 1;
const hashStage = location.hash.match(/^#stage-([123])$/);
if(hashStage) current = Number(hashStage[1]);
if(![1,2,3].includes(current)) current = 1;

function showStage(id){
  current = id;
  store.set("tri.stage", String(id));
  stages.forEach(s => { s.hidden = Number(s.dataset.stage) !== id; });
  tocGroups.forEach(g => { g.hidden = Number(g.dataset.stage) !== id; });
  stageLinks.forEach(a => {
    if(Number(a.dataset.stageLink) === id) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  applySearch();
}
stageLinks.forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  showStage(Number(a.dataset.stageLink));
  const top = layout.getBoundingClientRect().top + window.scrollY - topBar.offsetHeight;
  if(window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
}));

/* ───────── 검색 ───────── */
const qInput = document.getElementById("q");
function applySearch(){
  const raw = qInput.value.trim();
  const q = raw.toLowerCase();
  const stage = stages.find(s => Number(s.dataset.stage) === current);
  let any = false;
  stage.querySelectorAll(".sec").forEach(sec => {
    const link = document.querySelector(`.toc a[data-for="${sec.id}"]`);
    const countEl = sec.querySelector(".count");
    const note = sec.querySelector(".note");
    if(note) note.hidden = !!q;
    if(sec.dataset.type === "kana" || sec.dataset.type === "pinyin"){
      sec.hidden = !!q;
      if(link) link.hidden = !!q;
      if(!q) any = true;
      return;
    }
    let n = 0;
    sec.querySelectorAll("[data-text]").forEach(it => {
      const ok = !q || it.dataset.text.includes(q);
      it.hidden = !ok;
      if(ok) n++;
    });
    sec.hidden = n === 0;
    if(link){
      link.hidden = n === 0;
      const ls = link.querySelector("span");
      if(ls) ls.textContent = String(n);
    }
    if(countEl) countEl.textContent = q ? `${n} / ${countEl.dataset.total}개` : `${countEl.dataset.total}개`;
    if(n) any = true;
  });
  const empty = stage.querySelector(".empty-state");
  empty.hidden = any;
  if(!any) empty.querySelector("strong").textContent = `"${raw}"와 맞는 표현이 ${current}단계에 없습니다`;
  watchToc();
}
qInput.addEventListener("input", applySearch);

/* ───────── 보기 설정 패널 ───────── */
const view = document.querySelector(".view");
document.addEventListener("keydown", e => {
  if(e.key === "Escape" && view.open){ view.open = false; view.querySelector("summary").focus(); }
});
/* iOS WebKit은 버튼, 링크가 아닌 요소를 탭하면 click을 상위로 보내지 않으므로 pointer 이벤트 사용 */
document.addEventListener("pointerdown", e => {
  if(view.open && !e.target.closest(".top")) view.open = false;
});
document.querySelectorAll(".hide-cb").forEach(cb => cb.addEventListener("change", () => {
  document.querySelectorAll(".cell.shown").forEach(c => c.classList.remove("shown"));
}));

/* ───────── 발음 듣기 (버튼이라 click 사용) ───────── */
document.addEventListener("click", e => {
  const say = e.target.closest("[data-say]");
  if(say) speak(say.dataset.say, say.dataset.lang);
});

/* ───────── 가린 칸 확인 ─────────
   칸은 div라 iOS에서 click이 오지 않음 → pointerup 사용 (스크롤 중에는 pointercancel이 와서 무시됨) */
document.addEventListener("pointerup", e => {
  if(e.button !== 0 || e.target.closest("[data-say]")) return;
  const c = e.target.closest(".cell");
  if(!c) return;
  const lang = ["ko","ja","zh","en"].find(l => c.classList.contains(l));
  if(document.getElementById("hide-" + lang).checked) c.classList.toggle("shown");
});

/* ───────── 공부할 언어 기억 ─────────
   선택은 CSS(:has)가 처리하고, 여기서는 저장과 복원만 한다 */
const showCbs = [...document.querySelectorAll(".show-cb")];
const savedLangs = store.get("tri.langs");
if(savedLangs !== null){
  const on = savedLangs.split(",");
  showCbs.forEach(cb => { cb.checked = on.includes(cb.id.slice(5)); });
}
showCbs.forEach(cb => cb.addEventListener("change", () => {
  store.set("tri.langs", showCbs.filter(c => c.checked).map(c => c.id.slice(5)).join(","));
  watchToc();
}));

/* ───────── 목차 현재 위치 ───────── */
const toc = document.getElementById("toc");
let io;
function watchToc(){
  if(io) io.disconnect();
  if(!("IntersectionObserver" in window)) return;
  const links = [...toc.querySelectorAll("a[data-for]")];
  io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      links.forEach(l => {
        const on = l.dataset.for === e.target.id;
        l.classList.toggle("on", on);
        // 모바일 가로 칩 목록에서 현재 주제를 보이게 유지
        if(on && toc.scrollWidth > toc.clientWidth){
          toc.scrollTo({ left: toc.scrollLeft + l.getBoundingClientRect().left - toc.getBoundingClientRect().left - 16, behavior: "smooth" });
        }
      });
    });
  }, { rootMargin: "-140px 0px -60% 0px" });
  document.querySelectorAll(".stage:not([hidden]) .sec:not([hidden])").forEach(s => io.observe(s));
}

showStage(current);
