import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // 단계 페이지: 주제 목록과 단계 전체 검색
  route(":stage", "routes/stage.tsx"),
  // 주제 페이지 (v2.4): /basic/greet
  route(":stage/:topic", "routes/topic.tsx"),
] satisfies RouteConfig;
