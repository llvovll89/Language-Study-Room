/* 학습 데이터 (수정 후 npm run build). 한글 발음 기호는 docs/pron-notation.md 참고
   list:    [한국어, [일본어, 가나 읽기, 한글 발음], [중국어, 병음, 한글 발음], [영어, 한글 발음]]
   dialog:  [화자, 한국어, [일본어, 한글 발음], [중국어, 병음, 한글 발음], [영어, 한글 발음]]
   pattern: [[패턴 한, 패턴 日, 패턴 中, 패턴 EN], 한국어 예문, [日, 발음], [中, 병음, 발음], [EN, 발음]]
   table:   head/rows 칸은 문자열 또는 [텍스트, 한글 발음]
   concept: 개념(문법) 섹션. head/rows(언어 비교 표, 선택) + items(list 형식 예문, 3개 이상)
            table 섹션에 concept:true를 붙이면 "개념" 표시만 붙는다
   sub:     "日本語 / 中文 / English"
*/
import { STAGE1 } from "./stage1.js";
import { STAGE2 } from "./stage2.js";
import { STAGE3 } from "./stage3.js";

export { SEION, DAKUON, YOON } from "./kana.js";
export { PINYIN } from "./pinyin.js";
export const STAGES = [STAGE1, STAGE2, STAGE3];
