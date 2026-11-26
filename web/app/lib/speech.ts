/* 발음 듣기 (Web Speech API). 기존 runtime.js의 speak와 같은 규칙
   일부 환경은 speechSynthesis만 있고 SpeechSynthesisUtterance가 없으므로 둘 다 확인하고,
   음성 엔진 오류가 화면(문제 풀기 등)을 깨뜨리지 않게 막는다 */
export const canSpeak = () =>
  typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

export const speak = (text: string, lang: string) => {
  if(!canSpeak()) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[～~○]/g, ""));
    u.lang = lang;
    u.rate = lang === "en-US" ? 0.9 : 0.85;
    speechSynthesis.speak(u);
  }catch{
    /* 음성 엔진 오류는 무시 (소리만 안 남) */
  }
};
