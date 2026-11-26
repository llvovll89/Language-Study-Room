/* 한글 발음 표기 변환 (규칙: docs/pron-notation.md)
   build.mjs와 단위 테스트(tests/unit)가 함께 쓴다 */

export const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const TONES = { 1: "→", 2: "↗", 3: "↘↗", 4: "↘", 0: "·" };
const TONE_NAMES = { 1: "1성", 2: "2성", 3: "3성", 4: "4성", 0: "경성" };

/* data 표기 → HTML. 성조 숫자는 중국어(lang === "zh")에서만 해석한다 */
export const renderPron = (text, lang) => {
  let h = esc(text);
  if(lang === "zh") h = h.replace(/[0-4]/g, d => `<sup class="tone t${d}" title="${TONE_NAMES[d]}">${TONES[d]}</sup>`);
  return h
    .replace(/\[/g, '<span class="hi">').replace(/\]/g, "</span>")
    .replace(/\(/g, '<span class="weak">').replace(/\)/g, "</span>")
    .replace(/_/g, '<span class="link" aria-hidden="true">‿</span>')
    .replace(/\s*\|\s*/g, ' <span class="pause" aria-hidden="true"></span> ');
};

/* 검색용: 표기 기호와 성조 숫자를 지운다 */
export const plainPron = (p, lang) => (lang === "zh" ? p.replace(/[0-4]/g, "") : p).replace(/[\[\]()_|]/g, "");

/* 검색용: 병음 원형 + 성조 기호 없는 형태 + 붙여 쓴 형태 (ü는 u와 v 둘 다로 찾을 수 있게) */
export const plainPinyin = py => {
  const strip = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const bareU = strip(py);
  const bareV = strip(py.replace(/[üǖǘǚǜ]/g, "v"));
  const forms = [py, bareU, bareU.replace(/\s+/g, "")];
  if(bareV !== bareU) forms.push(bareV, bareV.replace(/\s+/g, ""));
  return forms.join(" ");
};
