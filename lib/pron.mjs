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

/* data 표기 → 토큰 트리 (React용: HTML 문자열 없이 element로 그린다)
   { t:"text", v } | { t:"tone", d, mark, name } | { t:"link" } | { t:"pause" } | { t:"hi"|"weak", c:[...] }
   renderPron과 같은 규칙: 성조 숫자는 zh에서만, | 앞뒤 공백은 하나로 */
export const tokenizePron = (text, lang) => {
  const root = [];
  let cur = root;
  const stack = [];
  const pushText = v => {
    const last = cur[cur.length - 1];
    if(last && last.t === "text") last.v += v; else cur.push({ t: "text", v });
  };
  const src = text.replace(/\s*\|\s*/g, "|");
  for(const ch of src){
    if(ch === "[" || ch === "("){
      const node = { t: ch === "[" ? "hi" : "weak", c: [] };
      cur.push(node); stack.push(cur); cur = node.c;
    } else if((ch === "]" || ch === ")") && stack.length){
      cur = stack.pop();
    } else if(ch === "_"){
      cur.push({ t: "link" });
    } else if(ch === "|"){
      pushText(" "); cur.push({ t: "pause" }); pushText(" ");
    } else if(lang === "zh" && /[0-4]/.test(ch)){
      cur.push({ t: "tone", d: Number(ch), mark: TONES[ch], name: TONE_NAMES[ch] });
    } else {
      pushText(ch);
    }
  }
  return root;
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
