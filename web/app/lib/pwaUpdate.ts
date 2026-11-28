/* PWA 자동 업데이트 규칙 (v2.4.1). DOM과 React를 쓰지 않는 순수 함수라 단위 테스트한다
   실제 연결은 app/components/update.tsx의 usePWAUpdate */

/** 실행 직후 이 시간 안에 새 버전을 찾으면 바로 새로고침한다 (아직 읽기 시작 전) */
export const APPLY_NOW_MS = 5_000;
/** 켜 둔 동안 새 버전 확인 간격 */
export const CHECK_EVERY_MS = 30 * 60_000;
/** 백그라운드에서 돌아올 때 확인은 이 간격보다 자주 하지 않는다 */
export const MIN_CHECK_GAP_MS = 60_000;
/** 새로고침 뒤 "새 버전으로 업데이트했어요" 안내를 띄우기 위한 sessionStorage 키 */
export const UPDATED_FLAG = "tri.updated";
/** 안내를 보여 주는 시간 */
export const TOAST_MS = 3_000;

export interface UpdateState {
  /** 앱이 시작된 뒤 지난 시간 */
  sinceStart: number;
  /** 문제 풀기나 보여 주기 카드(<dialog>)가 열려 있음 */
  dialogOpen: boolean;
  /** 화면이 백그라운드에 있음 */
  hidden: boolean;
}

/** 새 서비스 워커가 화면을 넘겨받았을 때: 지금 새로고침할지, 다음 기회로 미룰지 */
export const onUpdateFound = ({ sinceStart, dialogOpen, hidden }: UpdateState): "reload" | "defer" =>
  dialogOpen ? "defer" : hidden || sinceStart <= APPLY_NOW_MS ? "reload" : "defer";

/** 미뤄 둔 업데이트를 지금(링크를 누름, 백그라운드로 감) 적용해도 되는지 */
export const canApplyDeferred = ({ dialogOpen }: Pick<UpdateState, "dialogOpen">) => !dialogOpen;

/** 첫 설치(전에 제어하던 서비스 워커가 없음)는 업데이트가 아니다 */
export const isRealUpdate = (hadControllerAtStart: boolean) => hadControllerAtStart;

/** 새 버전 확인 간격 제한 */
export const shouldCheck = (now: number, lastCheck: number) => now - lastCheck >= MIN_CHECK_GAP_MS;

/** 미뤄 둔 업데이트가 있을 때, 이 링크를 새 버전으로 열어야 하는지 (같은 사이트의 일반 클릭만) */
export const takesOverLink = (
  link: { origin: string; target: string; download: boolean; hash: boolean },
  click: { button: number; modifier: boolean; defaultPrevented: boolean },
  origin: string,
) => !click.defaultPrevented && click.button === 0 && !click.modifier &&
  link.origin === origin && (!link.target || link.target === "_self") && !link.download && !link.hash;

/** footer 빌드 표시: KST "MM-DD HH:mm" (+ 커밋 7자리) */
export const buildStamp = (date: Date, sha?: string) => {
  const kst = new Date(date.getTime() + 9 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  const time = `${p(kst.getUTCMonth() + 1)}-${p(kst.getUTCDate())} ${p(kst.getUTCHours())}:${p(kst.getUTCMinutes())}`;
  return sha ? `${time} · ${sha.slice(0, 7)}` : time;
};

/** 주제 페이지 주소 (/basic/greet). 서비스 워커는 이 주소의 .data만 연 것을 저장한다 (scripts/sw.mjs와 같은 규칙) */
export const isTopicPath = (path: string) => /^\/[a-z]+\/[a-z0-9-]+$/.test(path);

