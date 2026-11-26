# 언어 공부노트 (Language Study Room)

한국어를 기준으로 일본어, 중국어, 영어를 함께 배우는 정적 HTML 공부노트입니다.
- 학습자는 **한국어만 아는 사람**으로 가정합니다. 모든 외국어에 한글 발음을 붙입니다.
- 결과물은 `language-study.html` 한 파일입니다. JS 없이도 읽혀야 하고(아이폰 파일 미리보기), 오프라인에서도 열려야 합니다.

## 구조
- `data/`: 학습 데이터. 형식은 `data/index.js` 주석에 있습니다.
  - `stage1~3.js`: 단계별 데이터
  - `kana.js`: 가나표
  - `pinyin.js`: 병음표
- `build.mjs`: 데이터를 정적 HTML로 미리 렌더링합니다.
- `styles.css`, `runtime.js`: 빌드할 때 HTML 안에 inline으로 들어갑니다.
- `lib/pron.mjs`: 한글 발음 표기 변환 (build와 단위 테스트가 함께 사용)
- `scripts/validate-data.mjs`: 데이터 검증 (빈 칸, 기호 짝, 성조 숫자와 병음 음절 수)
- `tests/`: Playwright 테스트. 세 프로젝트로 돌립니다.
  - `iphone13-nojs`: JS 없는 아이폰
  - `iphone13-js`: JS 켠 아이폰
  - `desktop-chromium`: 데스크톱 Chrome
- `docs/`
  - `ROADMAP.md`: 버전 계획
  - `pron-notation.md`: 한글 발음 표기 규칙

## 명령
- `npm run validate`: 데이터를 검증합니다.
- `npm run build`: HTML을 빌드합니다.
- `npm run test:unit`: `node:test` 단위 테스트를 돌립니다 (`tests/unit/`).
- `npm run test:e2e`: Playwright를 돌립니다.
- `npm test`: 검증, 단위 테스트, 빌드, E2E를 차례로 돌립니다. 작업이 끝나면 반드시 실행합니다.
- README의 버전 히스토리 표와 배지 버전도 버전을 올릴 때 함께 갱신합니다.

## 버전 관리 규칙 (필수)
모든 작업은 버전 단위로 진행하고 기록을 남깁니다.

1. **작업 시작 전**에 `docs/ROADMAP.md`에서 이 작업이 어느 버전인지 정합니다. 로드맵에 없는 작업이면 ROADMAP에 먼저 추가하고, 이번 버전에 넣을지 다음 버전으로 미룰지 교수님께 확인합니다.
2. 브랜치는 `feature/vX.Y` 또는 `fix/vX.Y.Z`로 만듭니다. `main`에 직접 커밋하지 않습니다.
3. **작업 완료 시** 아래를 함께 갱신합니다.
   - `CHANGELOG.md`: 해당 버전 항목 (추가/변경/수정)
   - `package.json`의 `version`: footer에 `vX.Y`로 자동 표시됩니다.
   - `docs/ROADMAP.md`: 상태 (계획 → 진행 중 → 완료)
4. 버전 번호 규칙
   - 기능이나 콘텐츠 묶음: minor (`1.1` → `1.2`)
   - 오탈자나 버그 수정: patch (`1.1.0` → `1.1.1`)
   - 구조를 크게 바꿀 때: major
5. `main`에 merge한 뒤 `vX.Y` 태그를 달고 push합니다 (`git tag -a vX.Y -m "vX.Y"`).

## 콘텐츠 작성 규칙
- 한글 발음의 높낮이와 속도 표기는 `docs/pron-notation.md`를 따릅니다.
  - `[ ]`: 높게, 세게
  - 성조 숫자: 중국어
  - `-`: 길게
  - `_`: 연음
  - `( )`: 약음
  - `|`: 쉼
- 중국어는 간체 普通话로 씁니다. 병음은 음절마다 띄어 쓰고 성조 기호를 붙입니다.
- 예문에 실제 개인 이름이나 정보를 넣지 않습니다. 공개 서비스이므로 이름이 필요하면 `홍길동(ホン・ギルドン / 洪吉童 / Gildong Hong)`처럼 흔한 가상 이름을 씁니다.
- 데이터를 고친 뒤에는 `npm run validate`가 통과해야 합니다.
- 새 섹션 type을 추가하면 `build.mjs`의 `renderSection`과 `runtime.js`의 검색 처리도 함께 고칩니다.
