/* 데이터 검증: node scripts/validate-data.mjs
   빈 칸, 괄호 짝, 중국어 성조 숫자 개수와 병음 음절 수 일치를 확인한다 */
import { STAGES, TRAVEL, PINYIN } from "../data/index.js";

const errors = [];
const PY_SYL = /[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+/gi;
const err = (id, msg, v) => errors.push(`${id}: ${msg} → ${JSON.stringify(v)}`);

const checkMarkup = (id, pron) => {
  for(const [o, c] of [["[", "]"], ["(", ")"]]){
    let depth = 0;
    for(const ch of pron){
      if(ch === o){ depth++; if(depth > 1) return err(id, `${o} 중첩`, pron); }
      if(ch === c){ depth--; if(depth < 0) return err(id, `${c} 짝 없음`, pron); }
    }
    if(depth) err(id, `${o} 닫히지 않음`, pron);
  }
};
const checkJa = (id, ja, pron) => {
  if(!ja || !pron) err(id, "일본어 또는 발음 비어 있음", [ja, pron]);
  if(/[0-9]/.test(pron)) err(id, "일본어 발음에 숫자", pron);
  checkMarkup(id, pron);
};
const checkEn = (id, en, pron) => {
  if(!en || !pron) err(id, "영어 또는 발음 비어 있음", [en, pron]);
  if(/[0-9]/.test(pron)) err(id, "영어 발음에 숫자", pron);
  checkMarkup(id, pron);
};
const checkZh = (id, zh, py, pron) => {
  if(!zh || !py || !pron) return err(id, "중국어 칸 비어 있음", [zh, py, pron]);
  const syl = (py.match(PY_SYL) || []).length;
  const tones = (pron.match(/[0-4]/g) || []).length;
  if(syl !== tones) err(id, `병음 ${syl}음절인데 성조 숫자 ${tones}개`, [py, pron]);
  if(/[a-z]/i.test(pron)) err(id, "중국어 한글 발음에 알파벳", pron);
  checkMarkup(id, pron);
};

for(const st of [...STAGES, TRAVEL]){
  for(const sec of st.sections){
    const id = sec.id;
    if(sec.sub.split(" / ").length !== 3 || sec.sub.split(" / ").some(s => !s.trim())) err(id, "sub는 '日 / 中 / EN' 3칸", sec.sub);
    if(/^日 \/ 中 \/ EN$/.test(sec.sub)) err(id, "sub가 형식 예시 그대로임", sec.sub);
    if(sec.type === "table" || sec.type === "concept"){
      (sec.rows || []).forEach((r, i) => {
        if(r.length !== sec.head.length) err(`${id}#${i}`, "열 개수 불일치", r);
        r.forEach((c, j) => { if(c === "" && sec.head[j] !== "") err(`${id}#${i}`, `빈 칸 (${sec.head[j]})`, r); });
      });
      if(sec.type === "table") continue;
      if(!sec.items || sec.items.length < 3) err(id, "개념 섹션에는 예문(items)이 3개 이상 필요", sec.items?.length);
    }
    if(st === TRAVEL && (!sec.items || sec.items.length < 12)) err(id, "여행 섹션은 항목 12개 이상", sec.items?.length);
    (sec.items || []).forEach((it, i) => {
      const key = `${id}#${i}`;
      if(sec.type === "list" || sec.type === "concept" || sec.type === "card"){
        const [ko, [ja, , jp], [zh, py, zp], [en, ep]] = it;
        if(!ko) err(key, "한국어 비어 있음", it);
        checkJa(key, ja, jp); checkZh(key, zh, py, zp); checkEn(key, en, ep);
      } else if(sec.type === "dialog"){
        const [who, ko, [ja, jp], [zh, py, zp], [en, ep]] = it;
        if(!who || !ko) err(key, "화자 또는 한국어 비어 있음", it);
        checkJa(key, ja, jp); checkZh(key, zh, py, zp); checkEn(key, en, ep);
      } else if(sec.type === "pattern"){
        const [tags, ko, [ja, jp], [zh, py, zp], [en, ep]] = it;
        if(tags.length !== 4 || tags.some(t => !t)) err(key, "패턴 태그 4개 필요", tags);
        if(!ko) err(key, "한국어 비어 있음", it);
        checkJa(key, ja, jp); checkZh(key, zh, py, zp); checkEn(key, en, ep);
      }
    });
  }
}
PINYIN.tones.forEach(([c, py, , pron], i) => checkZh(`pinyin.tones#${i}`, c, py, pron));

if(errors.length){
  console.error(errors.join("\n"));
  console.error(`\n${errors.length}개 문제`);
  process.exit(1);
}
console.log("data ok");
