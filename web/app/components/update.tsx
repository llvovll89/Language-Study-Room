import { useEffect, useState } from "react";
import {
  canApplyDeferred, CHECK_EVERY_MS, isRealUpdate, isTopicPath, onUpdateFound, shouldCheck, takesOverLink, TOAST_MS, UPDATED_FLAG,
} from "~/lib/pwaUpdate";

/* PWA 자동 업데이트 (v2.4.1)
   - 서비스 워커 등록 + 새 버전 확인: 시작, 백그라운드에서 복귀(1분에 한 번까지), 켜 둔 동안 30분마다
   - 새 서비스 워커가 화면을 넘겨받으면(sw.js는 skipWaiting + clientsClaim)
     실행 직후 5초 안: 바로 새로고침 / 사용 중: 다음 링크 클릭이나 백그라운드로 갈 때 적용
     문제 풀기·보여 주기 카드(<dialog>)가 열려 있으면 미룸
   - 첫 설치는 업데이트가 아님 (시작할 때 제어하던 서비스 워커가 없었음)
   반환: 새로고침 직후 "새 버전으로 업데이트했어요" 안내를 보여 줄지 */
export function usePWAUpdate(){
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    let flag = false;
    try{ flag = sessionStorage.getItem(UPDATED_FLAG) === "1"; sessionStorage.removeItem(UPDATED_FLAG); }catch{ /* 저장소를 못 쓰면 안내 없이 진행 */ }
    if(!flag) return;
    setJustUpdated(true);
    const t = setTimeout(() => setJustUpdated(false), TOAST_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if(import.meta.env.DEV || !("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    const start = performance.now();
    const hadController = !!sw.controller;
    const dialogOpen = () => !!document.querySelector("dialog[open]");
    let pending = false;
    let reloading = false;
    let lastCheck = 0;
    let update: (() => Promise<unknown>) | null = null;

    const apply = (href?: string) => {
      if(reloading) return;
      reloading = true;
      try{ sessionStorage.setItem(UPDATED_FLAG, "1"); }catch{ /* 안내만 빠진다 */ }
      if(href) location.assign(href); else location.reload();
    };
    const check = () => {
      const now = Date.now();
      if(!update || !shouldCheck(now, lastCheck)) return;
      lastCheck = now;
      update().catch(() => { /* 오프라인 등: 다음에 다시 확인 */ });
    };

    const onControllerChange = () => {
      if(!isRealUpdate(hadController) || reloading) return;
      const action = onUpdateFound({ sinceStart: performance.now() - start, dialogOpen: dialogOpen(), hidden: document.visibilityState === "hidden" });
      if(action === "reload") apply(); else pending = true;
    };
    const onVisibility = () => {
      if(document.visibilityState === "visible") check();
      else if(pending && canApplyDeferred({ dialogOpen: dialogOpen() })) apply();
    };
    // 새 버전이 기다리는 중에 누른 링크는 새 버전으로 연다 (옛 화면이 지워진 옛 파일을 찾지 않게)
    const onClick = (e: MouseEvent) => {
      if(!pending) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if(!a) return;
      const sameDoc = a.pathname === location.pathname && a.search === location.search && !!a.hash;
      const ok = takesOverLink(
        { origin: a.origin, target: a.target, download: a.hasAttribute("download"), hash: sameDoc },
        { button: e.button, modifier: e.metaKey || e.ctrlKey || e.shiftKey || e.altKey, defaultPrevented: e.defaultPrevented },
        location.origin,
      );
      if(!ok || !canApplyDeferred({ dialogOpen: dialogOpen() })) return;
      e.preventDefault();
      e.stopPropagation();
      apply(a.href);
    };

    sw.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("click", onClick, true);
    const timer = setInterval(() => { if(document.visibilityState === "visible") check(); }, CHECK_EVERY_MS);

    /* v2.4.2: 주제를 새로고침·주소 입력처럼 전체 페이지로 열면 데이터가 HTML 안에 있어 .data를 따로 받지 않는다
       그러면 오프라인에서 열리지 않으므로, 서비스 워커가 제어 중일 때 이 주제의 .data를 한 번 받아 저장되게 한다 */
    if(hadController && navigator.onLine && isTopicPath(location.pathname)) fetch(`${location.pathname}.data`).catch(() => { /* 다음에 열 때 다시 */ });

    // 등록 자체가 첫 확인이다
    import("workbox-window")
      .then(({ Workbox }) => { const wb = new Workbox("/sw.js"); update = () => wb.update(); return wb.register(); })
      .catch(() => { /* 등록 실패는 기능에 영향 없음 */ });

    return () => {
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onClick, true);
      clearInterval(timer);
    };
  }, []);

  return justUpdated;
}

/** 새로고침 직후 잠깐 보이는 안내 */
export const UpdateToast = ({ show }: { show: boolean }) => (
  <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 z-50 flex justify-center bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-8">
    {show && <p className="update-toast m-0 rounded-full bg-ink text-paper px-4 py-2.5 text-sm font-medium shadow-card">새 버전으로 업데이트했어요</p>}
  </div>
);
