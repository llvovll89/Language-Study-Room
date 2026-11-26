---
name: release
description: 이 프로젝트의 버전 작업을 규칙대로 마무리한다 (테스트 → 문서 4종 갱신 → 커밋 → PR → merge → 태그). "마무리해", "PR 올리고 merge", "릴리스", "버전 정리"처럼 작업 완료나 배포를 요청받았을 때, 또는 /release로 부를 때 사용한다.
---

# 버전 릴리스 절차 (Language Study Room)

`CLAUDE.md`의 "버전 관리 규칙"을 실행 순서로 옮긴 것입니다. 단계를 건너뛰지 말고, 실패하면 거기서 멈추고 사용자에게 알립니다.

## 0. 상태 확인
1. `git status`와 `git branch --show-current`를 확인합니다.
   - `main`이면 멈추고, 작업 브랜치(`feature/vX.Y` 또는 `fix/vX.Y.Z`)를 먼저 만듭니다.
2. `docs/ROADMAP.md`에서 이번 버전을 확인합니다.
   - 로드맵에 없는 작업이면 먼저 추가합니다.
   - 버전 번호(minor, patch, major)는 사용자와 확인합니다.
3. 버전 번호 규칙
   - 기능이나 콘텐츠 묶음: minor
   - 버그나 오탈자 수정, 도구 변경: patch
   - 구조를 크게 바꿀 때: major

## 1. 테스트 (전부 통과해야 다음 단계)
```bash
npm run test:all
```
- 순서: 데이터 검증 → 단위 테스트 → 단일 HTML 빌드와 E2E → 웹앱 단위 테스트 → 웹앱 빌드와 E2E
- 웹앱 타입 검사도 돌립니다: `cd web && npx react-router typegen && npx tsc -p .`
- 실패하면 원인을 고치고 다시 돌립니다. 테스트를 약하게 만들어 통과시키지 않습니다.
- 화면이 바뀐 작업이면 Playwright로 데스크톱과 모바일 스크린샷을 찍어 직접 확인합니다.
  - 테스트 서버: `node web/scripts/serve.mjs <port>`
  - 4173 포트는 다른 프로젝트가 쓸 수 있으니 4180 이상을 씁니다.
  - 끝나면 띄운 서버를 종료합니다.

## 2. 문서 4종 갱신 (같은 커밋에 포함)
1. **버전 번호**: 루트 `package.json`과 `web/package.json`의 `version`을 함께 올립니다. 두 결과물 footer에 `vX.Y`로 자동 표시됩니다.
2. **`CHANGELOG.md`**: 맨 위에 `## vX.Y.Z (YYYY-MM-DD)`를 추가하고 추가, 변경, 수정으로 나눠 적습니다.
3. **`docs/ROADMAP.md`**: 상태를 바꿉니다 (📋 계획 → 🚧 진행 중 → ✅ 완료).
4. **`README.md`**: 아래를 갱신합니다.
   - 버전 배지 (`version-vX.Y.Z`)
   - 버전 히스토리 표 (맨 위에 한 줄)
   - 로드맵 체크리스트
   - 테스트 수 (실제 실행 결과의 숫자를 그대로 씁니다)
   - 기능 표 (기능이 바뀐 경우)

구조, 명령, 규칙이 바뀌었으면 `CLAUDE.md`도 함께 고칩니다.

## 3. 커밋과 PR
- 커밋 메시지: `vX.Y: 한 줄 요약`
- 커밋할 때 `.claude/settings.json` hook이 데이터 검증과 단위 테스트를 자동으로 돌립니다. 실패하면 커밋이 막힙니다.
- 커밋 메시지와 PR 본문 끝에는 대화에서 안내된 attribution 줄을 붙입니다.
- PR은 아래처럼 만듭니다.
  ```bash
  git push -u origin <브랜치>
  gh pr create --base main --head <브랜치> --title "vX.Y: 요약" --body "<요약 / 추가 / 변경 / 수정 / 테스트 체크리스트>"
  ```
- PR 본문에 쓸 것
  - 실제 테스트 결과 숫자
  - 사실 정보의 출처 링크 (외부 사실을 다룬 경우)

## 4. merge와 태그 (사용자가 요청했을 때만)
merge는 되돌리기 어려우므로, 이번 대화에서 사용자가 merge를 요청했을 때만 진행합니다.
```bash
gh pr merge <번호> --merge --subject "Merge <브랜치>: vX.Y 릴리스"
git checkout main && git pull
git tag -a vX.Y -m "vX.Y"     # patch는 vX.Y.Z
git push origin vX.Y
```
- `main`에 merge되면 Vercel이 자동으로 배포합니다 (`web/`).

## 5. 보고
사용자에게 아래를 짧게 알립니다.
- PR 링크
- 테스트 결과 숫자
- 바뀐 점
- 남은 불확실한 점 (있으면)
