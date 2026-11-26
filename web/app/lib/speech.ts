/* 발음 듣기 (Web Speech API). 기존 runtime.js의 speak와 같은 규칙 */
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export const speak = (text: string, lang: string) => {
  if(!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[～~○]/g, ""));
  u.lang = lang;
  u.rate = lang === "en-US" ? 0.9 : 0.85;
  speechSynthesis.speak(u);
};
