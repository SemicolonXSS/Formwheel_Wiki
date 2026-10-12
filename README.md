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

## 사용자 문서 생성·편집 및 승인 (Spark 무료 요금제)

**Firebase Functions와 Secret Manager가 필요하지 않습니다.** 브라우저가 Firebase Authentication 및 Realtime Database를 사용합니다.

- 방문자는 Anonymous 로그인으로 문서 생성·편집 요청을 `wikiV1/proposals`에 **pending** 상태로 제출합니다.
- 승인 대기 요청은 일반 방문자에게 공개되지 않습니다.
- 관리자는 Google 계정으로 로그인한 후 Firebase에서 미리 등록한 **관리자 UID**로 권한 검증을 받고 승인·거부합니다.
- 승인할 때 `wikiV1/pages`에 문서가 저장되고, 요청은 **approved**로 변경됩니다. 거부 시 **rejected**로 변경됩니다.
- 관리자 비밀번호를 웹페이지에 저장하거나 코드만으로 관리자 권한을 얻는 방식은 사용하지 않습니다.

### 반드시 먼저 적용할 설정

1. Firebase Console → Authentication → Sign-in method에서 **Anonymous**, **Google** 로그인 방식을 활성화합니다. Authorized domains 목록에 `semicolonxss.github.io`가 있는지도 확인합니다.
2. Wiki → **편집 요청 관리** → **Google 로그인**을 선택해 관리자 계정으로 로그인합니다. 화면에 나타난 **UID**를 복사합니다. UID는 이메일 주소가 아닙니다.
3. Firebase Console → Realtime Database → Data 탭에서 `wikiV1/admins/복사한UID = true` (Boolean)를 추가합니다. 관리자 UID 등록은 Firebase Console에서만 수행합니다.
4. **현재 운영 Realtime Database 규칙을 백업**합니다. `wiki.rules.fragment.json`의 `wikiV1` 부분을 현재 `rules` 아래에 **병합**해 Rules 탭에서 게시합니다. 파일을 전체 규칙 대신 붙여 넣어 덮어쓰면 다른 게임이 손상될 수 있습니다.
5. **중요:** 루트 또는 상위 경로에 `".read": true`나 `".write": true`가 있으면 하위 규칙으로 권한을 거부할 수 없습니다. 해당 광역 공개 규칙을 먼저 안전하게 전환하지 않으면 승인 대기 문서가 노출되거나 임의 승인이 가능해집니다. 다른 Formwheel 게임들에 영향을 줄 수 있으므로 staging에서 테스트한 후에만 게시하세요.
6. GitHub Pages가 업데이트된 뒤 신규 문서 제출 → 관리자 목록 확인 → 승인 → 다른 기기에서 공개 확인 순서로 테스트합니다.

**보안 참고:** Firebase Spark에서도 Database Rules를 실제 운영 서버에 게시해야 보안이 적용됩니다. 규칙을 적용하지 않았거나 광역 공개 규칙이 남아 있으면 **승인 기능을 운영하지 마세요.** 브라우저에서 작성 버튼이 보이는 것과 실제 DB 접근 권한은 별개입니다.

기존 `functions/` 폴더는 이전 Blaze 방식의 참고용 파일이며 이 Spark 버전에서 사용하지 않습니다.

## 위키 문법

| 입력 | 동작 |
| --- | --- |
| `---개요---` | 새 단원 |
| `[battle]` | Wiki 내부 문서 링크 |
| `[https://example.com/path/GCrown]` | 외부 링크, 마지막 주소 부분을 표시 제목으로 사용 |
| `{[battle]}` | 링크가 아닌 글자 그대로 표시 |
| `==중요==` | **굵게** |
| `~~삭제됨~~` | ~~취소선~~ |
| `(*참고 설명)` | 본문 대신 우측 위 **💬 주석** 버튼의 팝업에 표시 |
| `\|\|이름\|\|설명\|\|` | 표 한 줄, 연속해서 여러 줄 입력 가능 |
| `{{{접기:제목` · 내용 · `}}}` | 접고 펼칠 수 있는 영역(각각 별도 줄) |

예시:

```text
---개요---
==Formwheel==의 소개 문서입니다. [battle] 참고.
(*문서 개선 제안: 규칙을 더 보강하기)

---특징---
||구분||설명||
||게임||멀티플레이||
||도구||제작 기능||

{{{접기:더 알아보기
~~예전 설명~~ 대신 최신 정보를 사용하세요.
}}}

그대로 출력: {[battle]}
```

모든 사용자가 작성한 본문은 HTML로 실행하지 않고 안전한 텍스트 문법으로 렌더링합니다.
