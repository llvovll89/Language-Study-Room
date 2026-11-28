/* 여행 탭 데이터 (웹앱 전용, v2.1~). 항목 형식은 data/index.js 주석과 같다
   card: list와 같은 형식. 웹앱에서 "보여 주기"를 누르면 그 외국어 문장을 큰 글씨로 띄운다 */
import { TRAVEL_TALK } from "./travel-talk.js";
import { TRAVEL_READ } from "./travel-read.js";

export const TRAVEL = {
  id: 4, name: "여행: 바로 쓰는 표현", short: "여행",
  desc: "일본, 중국, 영어권 여행에서 바로 쓰는 표현입니다. 공항부터 숙소, 교통, 식당, 쇼핑, 긴급 상황까지 장면별 회화를 익히고, 메뉴판과 표지판 읽는 법을 봅니다. 말이 막히면 '보여 주기 카드'를 눌러 화면을 그대로 보여 주세요.",
  /* 단계 페이지의 주제 묶음: from(섹션 id)부터 다음 묶음 전까지 (웹앱 전용) */
  parts: [
    { title: "보여 주기 카드", desc: "말하기 어려울 때 화면을 그대로 보여 줍니다.", from: "t-cards" },
    { title: "장면별 회화", desc: "공항부터 긴급 상황까지 여행 순서대로 익힙니다.", from: "t-airport" },
    { title: "읽기: 메뉴와 표지판", desc: "메뉴판, 음식 이름, 맛 표현, 표지판을 읽습니다.", from: "t-menu" },
  ],
  sections: [...TRAVEL_READ.cards, ...TRAVEL_TALK, ...TRAVEL_READ.reading],
};
