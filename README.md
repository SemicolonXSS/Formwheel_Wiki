# 📚 Formwheel Wiki

Formwheel 게임·도구·앱의 공식 안내 및 지식 저장소입니다.

**웹사이트:** https://semicolonxss.github.io/Formwheel_Wiki/

**Hub:** https://semicolonxss.github.io/Formwheel/

## 현재 기능
- 게임, 도구, 계정, 도움말을 포함한 25개 안내 문서
- 문서 검색과 카테고리 필터
- 브라우저별 즐겨찾기 (localStorage)
- 게임으로 바로 이동, 오류 제보 링크
- PC 및 모바일에 대응하는 반응형 UI

## 배포
GitHub Pages에서 **Deploy from a branch**를 선택하고 `main` 브랜치의 `/(root)` 폴더를 지정합니다.
저장소의 `index.html`이 위키 시작 페이지입니다.

## 계획
- 위키 본문을 데이터 파일로 분리
- 문서별 규칙, 공략과 업데이트 기록 확장
- 사용자 수정 제안 및 관리자 승인
- Hub에서 공식 위키 링크 연결

현재 문서들은 입문용 안내이며, 게임별 기능과 규칙은 변경될 수 있습니다.

## 사용자 문서 생성·편집 및 관리자 승인

위키 화면에서 **＋ 새 문서 작성**, 각 문서의 **✏️ 편집 요청**, 상단 **편집 요청 관리**를 사용합니다.

- 제출한 문서는 `wikiV1/proposals`에 **대기** 상태로 저장됩니다.
- 관리자는 서버에서만 확인하는 비밀 코드로 대기 요청을 조회하고 승인·거부합니다.
- 승인된 문서는 `wikiV1/pages`에서 공개적으로 읽을 수 있습니다.
- 거부된 요청은 게시되지 않습니다.
- Firebase Authentication의 Anonymous 로그인이 활성화되어 있어야 제출할 수 있습니다.

**중요: GitHub에 코드를 올린 것만으로 서버 기능이 작동하지 않습니다.** Firebase 프로젝트 `formwheel`에서 Cloud Functions(배포 요금제 요건 확인)를 실제 배포해야 합니다.

### 배포 체크리스트

1. Firebase 프로젝트에서 Anonymous Auth를 켜고 허용 도메인에 `semicolonxss.github.io`를 설정합니다.
2. Firebase CLI로 프로젝트를 `formwheel`에 연결합니다. 이 저장소 `functions/`를 Firebase Functions 소스 디렉터리로 지정합니다.
3. `firebase functions:secrets:set WIKI_ADMIN_CODE --project formwheel`를 실행하고 **사용자만 아는 관리자 확인 코드**를 콘솔에서 입력합니다. **코드를 GitHub 파일, 클라이언트 JS, GitHub Actions 로그에 기록하지 마세요.** 유출이 의심되면 변경하세요.
4. `firebase deploy --only functions:wikiSubmit,functions:wikiModerate --project formwheel` 로 두 Cloud Function을 배포합니다.
5. Realtime Database Rules의 **기존 규칙과 병합하여** `wikiV1/pages` 공개 읽기·클라이언트 쓰기 금지, `wikiV1/proposals` 읽기·쓰기 금지, `wikiV1/rate` 읽기·쓰기 금지를 설정하고 실제 배포합니다. 참고용 `wiki.rules.fragment.json`은 전체 규칙을 덮어쓰는 데 사용하면 안 됩니다.
6. 다른 모든 상위 경로를 포함하여 공개 쓰기 규칙(`".write": true`)이 있다면 하위 규칙만으로 쓰기 금지가 불가능합니다. 상위 공개 규칙부터 제거해야 합니다. 운영 데이터에 영향이 생길 수 있으므로 반드시 staging에서 먼저 점검하세요.
7. 새 문서 제출 → 요청 조회 → 승인/거부 → 새로고침 및 다른 기기에서 문서 공개 여부를 검증합니다.

**현재 주의:** 문서 내용은 텍스트로 표시됩니다. 승인 코드는 브라우저에 내장하지 않았습니다. 실제 배포와 Firebase Rules 적용 전에는 제출/승인 API가 실패할 수 있습니다. 코드 하나만으로 관리자 권한을 증명하므로 실제 운영 환경에서는 관리자 계정(custom claims)과 보안 모니터링을 추가하는 것이 좋습니다.
