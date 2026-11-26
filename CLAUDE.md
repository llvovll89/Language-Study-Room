# 언어 공부노트 (Language Study Room)

한국어를 기준으로 일본어, 중국어, 영어를 함께 배우는 공부노트입니다.
- 학습자는 **한국어만 아는 사람**으로 가정합니다. 모든 외국어에 한글 발음을 붙입니다.
- 공개 서비스입니다. 사이트는 누구나 쓰고, 관리는 1인이 합니다.

## 결과물 두 가지 (v2.0~)
| 결과물 | 위치 | 용도 |
|---|---|---|
| **웹앱** | `web/` (React 19 + React Router 8 + TS + Tailwind v4) | Vercel 배포. 메인 서비스. 새 기능은 여기에만 추가 |
| **단일 HTML** | `build.mjs` → `language-study.html` | 오프라인, 파일 미리보기(JS 없음)용. 콘텐츠만 웹앱을 따라감 |

- **두 결과물이 같이 쓰는 단일 원본**: `data/`(콘텐츠), `lib/pron.mjs`(발음 표기)
- data를 고치면 **두 빌드를 모두** 확인합니다 (`npm run test:all`).

## 구조
- `data/`: 학습 데이터. 형식은 `data/index.js` 주석에 있고, 타입은 `data/index.d.ts`에 있습니다.
  - `stage1~3.js`: 단계별 데이터
  - `travel.js` (+ `travel-talk.js`, `travel-read.js`): 여행 탭 (웹앱 전용, 단일 HTML에는 없음)
  - `toeic.js` (+ `toeic-exam.js`, `toeic-parts.js`, `toeic-vocab.js`): TOEIC 탭 (웹앱 전용, 영어만). 공식 사실은 파일 주석의 출처를 따르고, 예문과 문제는 새로 작성 (기출 문항 복제 금지)
  - `kana.js`: 가나표
  - `pinyin.js`: 병음표
- `lib/pron.mjs`: 한글 발음 표기 변환
  - `renderPron`: HTML 문자열 (단일 HTML용)
  - `tokenizePron`: 토큰 트리 (웹앱용, innerHTML을 쓰지 않음)
  - 검색 키 함수
- `scripts/validate-data.mjs`: 데이터 검증 (빈 칸, 기호 짝, 성조 숫자와 병음 음절 수)
- 단일 HTML: `build.mjs`, `styles.css`, `runtime.js`
- `tests/`: 단일 HTML용 E2E(iphone13-nojs, iphone13-js, desktop-chromium)와 공용 단위 테스트(`tests/unit/`)
- `web/`
  - `react-router.config.ts`: `ssr:false`이고 6개 경로를 prerender합니다 (`/`, `/basic`, `/intermediate`, `/advanced`, `/travel`, `/toeic`).
  - `app/routes/`: `home.tsx`, `stage.tsx`(`/:stage`)
  - `app/components/`
    - `cells.tsx`: 언어별 칸, 발음, 듣기 버튼
    - `sections.tsx`: 섹션 type별 본문, 표, 글자표
    - `chrome.tsx`: 상단 바, 탭, 목차, 설정 패널
    - `showcards.tsx`: 여행 탭 보여 주기 카드와 전체 화면 `<dialog>`
    - `quiz.tsx`: 섹션 아래 문제 풀기와 오답 노트
    - `toeic.tsx`: TOEIC 표현 카드와 Part 5 문제 카드
  - `app/lib/quiz.ts`: 문제 자동 생성 (순수 함수, 난수 주입). 단위 테스트 `web/tests/unit/` (Node type stripping으로 바로 실행)
  - `app/state/settings.tsx`: 공부할 언어, 가리기, 발음 표시 (localStorage `tri.langs`, `tri.pron`, `tri.slug`)
  - `app/app.css`
    - `@theme`: 디자인 토큰
    - `@layer components`: 반복되는 카드 요소의 짧은 class. prerender HTML 크기를 줄이려고 씁니다.
  - `scripts/sw.mjs`: 빌드 후 서비스 워커(PWA)를 생성하고 `404.html`을 만듭니다.
  - `scripts/serve.mjs`: Vercel과 같은 규칙의 테스트용 정적 서버 (port 4180)
  - `tests/e2e/`: Playwright (iphone13, iphone13-nojs, desktop-chrome)
  - `vercel.json`: 정적 배포 설정
- `docs/`
  - `ROADMAP.md`: 버전 계획
  - `pron-notation.md`: 한글 발음 표기 규칙

## 명령
| 명령 | 하는 일 |
|---|---|
| `npm test` | 단일 HTML: 데이터 검증 → 단위 테스트 → 빌드 → E2E |
| `npm run web:dev` | 웹앱 개발 서버 |
| `npm run web:build` | 웹앱 빌드 (prerender + 서비스 워커) |
| `npm run web:test` | 웹앱 빌드 → E2E |
| `npm run web:unit` | 웹앱 단위 테스트 (`web/tests/unit/*.test.ts`) |
| `npm run test:all` | 위 모두. **작업이 끝나면 반드시 실행** |
| `npm run validate` | 데이터 검증만 |
| `npm run test:unit` | 단위 테스트만 |

- 웹앱 타입 검사: `cd web && npx react-router typegen && npx tsc`

## 웹앱 작성 규칙
- 반복되는 학습 카드 요소(칸, 엔트리, 표, 글자표)는 `app.css`의 짧은 component class를 씁니다. 페이지 레이아웃은 Tailwind utility로 씁니다.
- 콘텐츠(`@data`) 값은 `app/lib/content.server.ts`에서만 import합니다. 컴포넌트에서는 loader 데이터를 쓰고, 클라이언트 번들에 데이터가 들어가지 않게 합니다 (type import는 괜찮음).
- 발음 표기는 `tokenizePron` → `<Pron>` 컴포넌트로 그립니다. `dangerouslySetInnerHTML`은 쓰지 않습니다.
- 새 경로를 추가하면 `react-router.config.ts`의 `prerender` 목록에도 넣습니다.
- prerender HTML만으로 콘텐츠와 단계 이동 링크가 보여야 합니다. 설정 기능은 하이드레이션 이후 동작해도 됩니다.

## 배포 (Vercel)
- Root Directory는 `web`으로 둡니다. "Include files outside the root directory"는 켜 둡니다. 루트의 `data/`, `lib/`를 쓰기 때문입니다.
- 설치와 빌드는 `web/vercel.json`에 있습니다: 루트에서 `npm ci`, 출력은 `build/client`
- Node 22 이상

## Claude Code 설정 (저장소에 포함, 어느 PC에서든 같게 동작)
- **`.claude/settings.json` hook**: Claude가 `git commit`을 실행하기 전에 `scripts/hooks/pre-commit-check.mjs`가 검사를 돌립니다.
  - 검사 항목: `npm run validate`, `npm run test:unit`, `npm run web:unit`
  - 하나라도 실패하면 커밋을 막고 실패한 테스트 이름을 보여 줍니다.
  - 끄거나 확인하려면 `/hooks`를 엽니다.
- **`/release` skill** (`.claude/skills/release/SKILL.md`): 버전 마무리 절차를 순서대로 실행합니다.
  - 순서: `test:all` → 문서 4종 → 커밋 → PR → (요청 시) merge → 태그
  - "마무리해", "PR 올리고 merge" 같은 요청에도 이 절차를 따릅니다.
- **개인 설정** (`.claude/settings.local.json`): 커밋하지 않습니다.
- **전역 `~/.claude/CLAUDE.md`**: 호칭, 응답 언어 같은 개인 설정은 저장소에 없습니다. 새 PC에서는 직접 복사합니다.

## 버전 관리 규칙 (필수)
모든 작업은 버전 단위로 진행하고 기록을 남깁니다.

1. **작업 시작 전**
   - `docs/ROADMAP.md`에서 이 작업이 어느 버전인지 정합니다.
   - 로드맵에 없는 작업이면 ROADMAP에 먼저 추가하고, 이번 버전에 넣을지 다음 버전으로 미룰지 교수님께 확인합니다.
2. **브랜치**
   - `feature/vX.Y` 또는 `fix/vX.Y.Z`로 만듭니다.
   - `main`에 직접 커밋하지 않습니다.
3. **작업 완료 시** 아래를 함께 갱신합니다.
   - `CHANGELOG.md`: 해당 버전 항목 (추가/변경/수정)
   - 루트와 `web/`의 `package.json` `version`: 두 결과물 footer에 `vX.Y`로 자동 표시됩니다.
   - `docs/ROADMAP.md`: 상태 (계획 → 진행 중 → 완료)
   - README: 버전 히스토리 표와 배지
4. **버전 번호**
   - 기능이나 콘텐츠 묶음: minor (`2.0` → `2.1`)
   - 오탈자나 버그 수정: patch (`2.0.0` → `2.0.1`)
   - 구조를 크게 바꿀 때: major
5. **릴리스**: `main`에 merge한 뒤 `vX.Y` 태그를 달고 push합니다 (`git tag -a vX.Y -m "vX.Y"`).

## 콘텐츠 작성 규칙
- 한글 발음의 높낮이와 속도 표기는 `docs/pron-notation.md`를 따릅니다.
  - `[ ]`: 높게, 세게
  - 성조 숫자: 중국어
  - `-`: 길게
  - `_`: 연음
  - `( )`: 약음
  - `|`: 쉼
- 중국어는 간체 普通话로 씁니다. 병음은 음절마다 띄어 쓰고 성조 기호를 붙입니다.
- 예문에 실제 개인 이름이나 정보를 넣지 않습니다. 이름이 필요하면 `홍길동(ホン・ギルドン / 洪吉童 / Gildong Hong)`처럼 흔한 가상 이름을 씁니다.
- 데이터를 고친 뒤에는 `npm run validate`가 통과해야 합니다.
- 새 섹션 type을 추가할 때 함께 고칠 곳:
  - 웹앱: `web/app/components/sections.tsx`, `web/app/lib/search.ts`, `data/index.d.ts`
  - 단일 HTML: `build.mjs`의 `renderSection`
