# Baram — 현재 구현 상태

> 2026-09-14 기존 구현에서 계획 체계로 전환하며 작성. 코드와 실제 검증 결과가 우선한다.

| 시스템 | 현재 상태 | 주요 위치 | 제한 |
|---|---|---|---|
| 시작·접속 | 로딩 텍스트→원본 타이틀→생성→이어하기→테스트 맵 | RootDesk/MyDesk/BaramEntry | 원본 로딩 연출 미완성 |
| 외형 | 기본 몸 2종·머리 10종, 생성/게임 공유, 저장 호환 | RootDesk/MyDesk/BaramCharacter | 전체 목록·성별 제한 미확인 |
| 캐릭터 이동 | 단일 로컬 BaramActor, 4방향 수동 이동·카메라 | BaramMinimalController.mlua | 서버 캐릭터·타일 충돌·다인 동기화 필요 |
| HUD·채팅 | 원본 HUD, 독립 채팅 입력·서버 릴레이 | RootDesk/MyDesk/BaramHUD | 채팅 RPC 빌드 경고 추적 필요 |
| 능력치 | 기본 표시 및 레벨 데이터 로직 존재 | RootDesk/MyDesk/BaramStats | 실제 성장·전투 연결은 별도 검증 |
| 맵 | BaramMinimalTest, Ba000010/Map000000 자료 | map/, RootDesk/MyDesk/BaramMaps | M1 실제 부여 생활권 미연결 |
| 원본 분석 | DB 정규화·CMAP 목록·M1 데이터 목록 | Docs/BaramSource | 분석 결과를 런타임 등록으로 혼동 금지 |

## 유지할 규칙

- BaramCharacterV1 실계정 저장은 검증용 값으로 덮어쓰지 않는다. 별도 테스트 키를 사용한다.
- 외형 렌더러는 비동기 교체 후 비교한다. UI/게임 80조합 검증 기록은 Docs/BaramAppearance/README.md 참조.
- 지도 데이터·DB의 로컬 ID와 MSW 엔티티 ID를 분리한다.
- 기존 템플릿 맵 2개는 현재 남아 있다. 프로젝트 전체 정리가 완료됐다고 기록하지 않는다.

## 기록

### 2026-09-14 기존 베이스 조사

접속·외형·채팅·단일 테스트 액터를 재사용하는 M1을 시작한다. 원본 DB와 스크립트가 함께 제공되어 텍스트 데이터와 리소스를 연계할 수 있다. 부여성 생활권과 baram.in 비교 근거는 Docs/BaramSource/README.md, 다음 작업은 Docs/Baram-M1-Phase1.md에 있다.
