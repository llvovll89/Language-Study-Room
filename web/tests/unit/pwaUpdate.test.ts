/* PWA 자동 업데이트 규칙 단위 테스트 (v2.4.1): node --test web/tests/unit (Node 22 type stripping) */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  APPLY_NOW_MS, buildStamp, canApplyDeferred, isRealUpdate, isTopicPath, MIN_CHECK_GAP_MS, onUpdateFound, shouldCheck, takesOverLink,
} from "../../app/lib/pwaUpdate.ts";
import { readFileSync } from "node:fs";
import { STAGES, TOEIC, TRAVEL } from "../../../data/index.js";
import { allPaths } from "../../app/lib/topics.ts";

const base = { sinceStart: 1_000, dialogOpen: false, hidden: false };

test("실행 직후(5초 안)에 찾은 업데이트는 바로 새로고침한다", () => {
  assert.equal(onUpdateFound(base), "reload");
  assert.equal(onUpdateFound({ ...base, sinceStart: APPLY_NOW_MS }), "reload");
});

test("사용 중에 찾은 업데이트는 미루고, 백그라운드면 바로 적용한다", () => {
  assert.equal(onUpdateFound({ ...base, sinceStart: APPLY_NOW_MS + 1 }), "defer");
  assert.equal(onUpdateFound({ ...base, sinceStart: 60_000, hidden: true }), "reload");
});

test("문제 풀기·보여 주기 카드가 열려 있으면 언제든 미룬다", () => {
  assert.equal(onUpdateFound({ ...base, dialogOpen: true }), "defer");
  assert.equal(onUpdateFound({ ...base, dialogOpen: true, hidden: true }), "defer");
  assert.equal(canApplyDeferred({ dialogOpen: true }), false);
  assert.equal(canApplyDeferred({ dialogOpen: false }), true);
});

test("첫 설치(전에 제어하던 서비스 워커 없음)는 업데이트가 아니다", () => {
  assert.equal(isRealUpdate(false), false);
  assert.equal(isRealUpdate(true), true);
});

test("새 버전 확인은 1분에 한 번까지", () => {
  assert.equal(shouldCheck(10_000, 0), false);
  assert.equal(shouldCheck(MIN_CHECK_GAP_MS, 0), true);
  assert.equal(shouldCheck(100_000, 100_000 - MIN_CHECK_GAP_MS + 1), false);
});

test("기다리는 업데이트가 있으면 같은 사이트의 일반 클릭만 새 버전으로 연다", () => {
  const origin = "https://example.test";
  const link = { origin, target: "", download: false, hash: false };
  const click = { button: 0, modifier: false, defaultPrevented: false };
  assert.equal(takesOverLink(link, click, origin), true);
  assert.equal(takesOverLink({ ...link, target: "_self" }, click, origin), true);
  assert.equal(takesOverLink({ ...link, origin: "https://other.test" }, click, origin), false, "다른 사이트");
  assert.equal(takesOverLink({ ...link, target: "_blank" }, click, origin), false, "새 탭");
  assert.equal(takesOverLink({ ...link, download: true }, click, origin), false, "다운로드");
  assert.equal(takesOverLink({ ...link, hash: true }, click, origin), false, "같은 화면 안 이동");
  assert.equal(takesOverLink(link, { ...click, button: 1 }, origin), false, "가운데 버튼");
  assert.equal(takesOverLink(link, { ...click, modifier: true }, origin), false, "Ctrl·Cmd 클릭");
  assert.equal(takesOverLink(link, { ...click, defaultPrevented: true }, origin), false, "이미 처리된 클릭");
});

test("빌드 표시는 한국 시간 MM-DD HH:mm과 커밋 7자리", () => {
  const d = new Date("2026-11-28T05:05:00Z"); // KST 14:05
  assert.equal(buildStamp(d), "11-28 14:05");
  assert.equal(buildStamp(d, "abcdef1234567"), "11-28 14:05 · abcdef1");
  assert.equal(buildStamp(new Date("2026-12-31T15:30:00Z")), "01-01 00:30", "KST로 날짜가 넘어감");
});

test("주제 주소 판별: 모든 주제 페이지는 맞고 홈·단계 목록은 아니다 (서비스 워커 저장 규칙과 같다)", () => {
  const paths = allPaths([...STAGES, TRAVEL, TOEIC]);
  const topics = paths.filter(isTopicPath);
  assert.equal(topics.length, paths.length - 6, "홈 1 + 단계 5 말고 전부 주제");
  for(const p of ["/", "/basic", "/toeic", "/basic/greet/x", "/basic/../x"]) assert.equal(isTopicPath(p), false, p);
  // scripts/sw.mjs의 주제 데이터 규칙도 같은 모양이어야 한다
  const sw = readFileSync(new URL("../../scripts/sw.mjs", import.meta.url), "utf8");
  assert.ok(sw.includes("/^\\/[a-z]+\\/[a-z0-9-]+\\.data$/"), "sw.mjs의 주제 데이터 정규식");
});

