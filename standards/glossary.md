# Formwheel 공식 용어집 (Official Glossary)

- **버전:** v1.0.0 (표시명 v1.0)
- **확정일:** 2026-10-12
- **적용 대상:** Formwheel Hub, Wiki, Core, ID 및 전체 프로젝트
- **상태:** 공식 표준

## 1. 최상위 정책
1. Formwheel에 속하는 모든 게임·도구·앱·공통 시스템을 **프로젝트(Project)**라고 통칭한다. 게임은 프로젝트의 한 종류다.
2. 프로젝트 표시명은 **Battle**, **Clicker**, **Wiki**처럼 고유 이름만 사용한다. 일반 UI 제목에 `Formwheel Battle`, `폼휠 배틀`을 쓰지 않는다.
3. 공식 설명에서는 'Formwheel의 Battle 프로젝트'처럼 소속을 밝힐 수 있다.
4. 기존 GitHub 저장소명(`Formwheel_Battle`), URL, Firebase 경로 및 데이터 키는 호환성을 위해 유지한다.
5. 동일 기능은 전체 프로젝트에서 동일한 한국어 UI 문구를 사용한다. 브랜드 및 프로젝트 고유명은 유지한다.

## 2. 플랫폼 / 프로젝트
| 영어 | 공식 표기 | 뜻 |
|---|---|---|
| Formwheel | Formwheel | 전체 플랫폼 |
| Project | 프로젝트 | 개별 게임·도구·앱·시스템을 아우르는 단위 |
| Hub | 허브 | 프로젝트 탐색·진입 화면 |
| Core | 코어 | 공통 기능 시스템 |
| Formwheel ID | Formwheel ID | 통합 계정 시스템 |
| Game | 게임 | 플레이 중심 프로젝트 |
| Tool | 도구 | 작업을 돕는 프로젝트 |
| App | 앱 | 독립 기능 제공 프로젝트 |
| System | 시스템 | 공통 기능 제공 프로젝트 |
| Creator | 제작자 | 프로젝트 제작자 |
| User | 사용자 | 플랫폼 이용자 |
| Player | 플레이어 | 게임 참가 사용자 |
| Guest | 게스트 | 로그인하지 않은 사용자 |
| Profile | 프로필 | 개인 계정과 활동 화면 |
| Settings | 설정 | 환경 및 개인화 설정 |

## 3. 게임 / 매칭 / 방
| 영어 | 공식 표기 | 뜻 |
|---|---|---|
| Solo | 혼자하기 | 혼자 플레이 |
| Battle | 대전 | 다른 플레이어와 겨루는 모드 (프로젝트 이름 Battle은 그대로 유지) |
| Quick Match | 빠른 대전 | 공개 대기방 자동 연결 |
| Random Match | 랜덤 대전 | 무작위 상대 매칭 |
| Room | 방 | 다인용 참여 공간 |
| Room Code | 방 코드 | 방 입장 코드 |
| Host | 방장 | 방 생성·관리자 |
| Member | 참가자 | 방에 참여한 사용자 |
| Lobby | 대기실 | 시작 전 공간 |
| Round | 라운드 | 게임의 개별 진행 단위 |
| Turn | 턴 | 플레이어의 행동 차례 |
| Match | 매치 | 하나의 대전 |
| Result | 결과 | 종료 및 점수 화면 |
| Reconnect | 재접속 | 기존 세션 복구 |
| Spectator | 관전자 | 플레이하지 않고 지켜보는 사용자 |

## 4. 계정 / 소셜 / 기록
| 영어 | 공식 표기 |
|---|---|
| Sign In | 로그인 |
| Sign Up | 회원가입 |
| Sign Out | 로그아웃 |
| Friend | 친구 |
| Friend Request | 친구 요청 |
| Invite | 초대 |
| Notification | 알림 |
| Block | 차단 |
| Presence | 접속 상태 |
| Activity | 활동 기록 |
| Achievement | 업적 |
| Badge | 배지 |
| Featured Badge | 대표 배지 |
| Leaderboard | 순위표 |
| Ranking | 순위 |
| Season | 시즌 |
| Challenge | 챌린지 |
| Event | 이벤트 |
| Feedback | 개선 의견 |

**구별:** 업적은 달성 조건 및 달성 내역, 배지는 프로필에 표시되는 보상이다. 빠른 대전과 랜덤 대전은 다른 매칭 방식이다.

## 5. 공통 UI 문구
| 혼용 표현 | 공식 표시 |
|---|---|
| Home / 홈 이동 / 메인 이동 | 허브로 돌아가기 |
| Start / 게임하기 | 게임 시작 |
| 방 생성 / 방 만들기 | 방 만들기 |
| Join / 입장 | 방 참가 |
| Exit / 나가기 (방 화면) | 방 나가기 |
| Ranking / Leaderboard | 순위표 |
| 변경 사항 / 업데이트 로그 | 업데이트 내역 |
| 건의하기 / 버그 제보 | 개선 의견 보내기 |

## 6. 개발 명명 규칙
- 프로젝트 ID: 소문자 영문 (예: `battle`, `clicker`)
- JS 식별자: camelCase (예: `roomId`, `roomCode`, `hostUid`, `playerUid`, `gameState`, `matchState`, `lastActiveAt`)
- 경로 예시: `projects/battle/rooms/{roomId}`는 **신규 구조를 위한 예시일 뿐** 기존 Firebase 구조 변경을 지시하지 않는다.
- 기존 식별자·DB 키·보안 규칙을 사용자 표시 문구 통일 목적으로 자동 변경하지 않는다.

## 7. 적용 우선순위
1. 사용자에게 표시되는 제목, 버튼, 안내 문구를 통일한다.
2. 저장소·링크·인증·게임 룸 코드는 기존 호환성을 유지한다.
3. 외부 공유용 설명에서는 브랜드와 프로젝트 관계를 명확히 한다.
4. 예외가 필요하면 공식 용어집의 새 버전에 기록한다.

## 8. 버전 정책
`MAJOR.MINOR.PATCH`를 사용한다. v1.0은 v1.0.0의 축약이다.
- PATCH (v1.0.1): 오탈자·설명 정정
- MINOR (v1.1.0): 호환되는 용어·분류 추가
- MAJOR (v2.0.0): 기존 명칭 또는 핵심 규칙의 비호환 변경

공개된 과거 버전 파일은 수정 없이 보관하고, 변경 이력은 `CHANGELOG.md`에 남긴다.
