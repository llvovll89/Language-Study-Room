import { useEffect } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, type LinksFunction } from "react-router";
import { UpdateToast, usePWAUpdate } from "~/components/update";
import { stageMetas } from "~/lib/content.server";
import { SettingsProvider } from "~/state/settings";
import type { Route } from "./+types/root";
import "./app.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;700&family=Noto+Serif+SC:wght@400;700&family=Zen+Old+Mincho:wght@400;700&display=swap" },
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/icon-192.png" },
];

/* 모든 페이지가 쓰는 단계 요약 (prerender 때 실행) */
export function loader(){
  return { stages: stageMetas() };
}

export function Layout({ children }: { children: React.ReactNode }){
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#EEF1EC" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#151A21" media="(prefers-color-scheme: dark)" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App(){
  // 서비스 워커 등록과 자동 업데이트 (v2.4.1)
  const justUpdated = usePWAUpdate();
  // 하이드레이션 완료 표시 (테스트와 CSS에서 사용)
  useEffect(() => { document.documentElement.dataset.hydrated = ""; }, []);
  return <SettingsProvider><Outlet /><UpdateToast show={justUpdated} /></SettingsProvider>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps){
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="max-w-xl mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-bold mb-3">{notFound ? "페이지를 찾을 수 없습니다" : "문제가 생겼습니다"}</h1>
      <p className="text-muted mb-8">{notFound ? "주소를 다시 확인하거나 처음 화면으로 돌아가 주세요." : "잠시 뒤에 다시 시도해 주세요."}</p>
      <a href="/" className="inline-block rounded-full bg-ink text-paper px-5 py-2.5 font-medium">처음으로</a>
    </main>
  );
}
