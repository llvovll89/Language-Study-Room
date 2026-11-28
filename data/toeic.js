/* TOEIC 탭 데이터 (웹앱 전용, v2.3~). 영어만 다룬다
   사실 정보 출처 (2026-11-26 확인):
   - ETS: https://www.ets.org/toeic/about/listening-reading.html (2개 섹션 각 100문항, 듣기 45분, 읽기 75분, Part 1~7 이름)
   - YBM 한국TOEIC위원회: https://exam.toeic.co.kr/common/template/viewContents.php?contentsCode=19 (파트별 문항 수, 출제 기준, 출제 범위)
   - YBM 수험자가이드: https://exam.toeic.co.kr/common/template/viewContents.php?contentsCode=36 (규정 신분증, 성적 유효기간 2년)
   예문과 문제는 모두 새로 만든 것이다 (ETS 기출 문항을 옮기지 않음)

   형식
   toeic:    [영어 표현, 영어 한글 발음, 한국어 뜻, 영어 예문, 예문 뜻]  (예문은 "" 가능)
   problems: [문제 문장(빈칸 "_____"), [보기 A, B, C, D], 정답 index(0~3), 해설(한국어), 문법 포인트]
   table:    기존 table과 같음 */
import { TOEIC_ABOUT, TOEIC_GRAMMAR } from "./toeic-exam.js";
import { TOEIC_PARTS } from "./toeic-parts.js";
import { TOEIC_VOCAB } from "./toeic-vocab.js";

export const TOEIC = {
  id: 5, name: "TOEIC: 시험 구성과 빈출 표현", short: "TOEIC",
  desc: "직장 영어 시험 TOEIC(Listening & Reading)을 준비하는 탭입니다. 공식 자료로 확인한 시험 구성을 먼저 보고, 파트별 빈출 표현과 주제별 어휘를 익힌 뒤 Part 5 문법 문제를 해설과 함께 풀어 봅니다. 영어만 다루며 모든 표현에 한글 발음과 강세를 붙였습니다.",
  /* 단계 페이지의 주제 묶음: from(섹션 id)부터 다음 묶음 전까지 (웹앱 전용) */
  parts: [
    { title: "시험 안내", desc: "공식 자료로 확인한 시험 구성입니다.", from: "e-about" },
    { title: "파트별 빈출 표현", desc: "듣기 Part 1~4와 읽기 Part 6·7에 자주 나오는 표현입니다.", from: "e-part1" },
    { title: "Part 5 문법과 문제", desc: "빈출 문법을 정리하고 실전 문제로 확인합니다.", from: "e-grammar" },
    { title: "주제별 빈출 어휘", desc: "출제 범위 6개 주제의 어휘입니다.", from: "e-hr" },
  ],
  sections: [...TOEIC_ABOUT, ...TOEIC_PARTS, ...TOEIC_GRAMMAR, ...TOEIC_VOCAB],
};
