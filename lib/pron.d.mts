/* lib/pron.mjs 타입 정의 (web 앱이 사용) */
export type Lang = "ja" | "zh" | "en";
export type PronNode =
  | { t: "text"; v: string }
  | { t: "tone"; d: 0 | 1 | 2 | 3 | 4; mark: string; name: string }
  | { t: "link" }
  | { t: "pause" }
  | { t: "hi" | "weak"; c: PronNode[] };

export declare const esc: (s: unknown) => string;
export declare const TONES: Record<0 | 1 | 2 | 3 | 4, string>;
export declare const renderPron: (text: string, lang: Lang | string) => string;
export declare const tokenizePron: (text: string, lang: Lang | string) => PronNode[];
export declare const plainPron: (p: string, lang: Lang | string) => string;
export declare const plainPinyin: (py: string) => string;
