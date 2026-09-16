# NPC·몬스터·ETC 그룹 리소스 가져오기

대상 그룹: **FqXhK**. 원본: C:/Users/black/UI.

## 완료 결과

2026-09-16 KST 기준 원본 프레임·팔레트·염색 조합 **91,015개**에서 중복을 제거한 **83,008개 Sprite 이미지**를 그룹 리소스에 등록했다.

| 분류 | 이미지 수 |
|---|---:|
| NPC (NPC·몬스터 공용 포함) | 4,461 |
| 몬스터 | 17,972 |
| 배경·지형 | 27,809 |
| 오브젝트 | 29,461 |
| 기타·UI | 3,305 |
| 합계 | 83,008 |

- 전체 PNG: CRC, 해제 크기, SHA-256 검사 통과. 추출 당시 6개 원본 DAT 해시가 변하지 않았음을 확인했다.
- 서버 목록 833페이지 전수 대조: 83,008개 확인, 누락·중복·분류·픽셀 설정 오류 0건.
- 원본 조합 91,015개의 RUID 연결 오류 0건.
- NPC·몬스터 동작 변형 1,187개의 프레임 연결 오류 0건.
- filter_mode=0, wrap_mode=1 적용.
- 앞서 완료한 아이템·마법 이미지 5,565개는 ../BaramResourcePack/README.md 참조. 두 작업 합계는 88,573개다.

## 사용 파일

- [resource-map.json](resource-map.json): 이미지 이름 → 실제 RUID, 분류, SHA-256, 로컬 PNG 경로.
- [source-map.json](source-map.json): 원본 DAT/EPF 프레임·팔레트·염색 → RUID. 원본 left/top 오프셋과 크기를 보존했다.
- [actor-animation-map.json](actor-animation-map.json): imageId·염색별 동작 chunk와 프레임 RUID, duration, 원본 raw 필드. 동작 번호는 원본 순서 그대로다.
- [object-groups.json](object-groups.json): 원본 SObj 13,992개 그룹의 프레임 구성 및 속성.
- [inventory.json](inventory.json): 추출 작업, 원본 해시, NPC/몬스터 정의, 팔레트 근거 등 전체 원본 대응 정보.
- [resource-name-aliases.json](resource-name-aliases.json): 이름 길이로 실패한 미등록 리소스 1,092개의 원래 이름 → 줄인 등록명. 로컬 PNG 이름은 그대로 유지했다.
- [missing-actor-images.tsv](missing-actor-images.tsv): 원본에서 찾을 수 없는 NPC·몬스터 이미지 정의.
- [remote-validation.json](remote-validation.json): 전체 서버 전수 검증 결과.
- [extraction-validation.json](extraction-validation.json): PNG 전수 검증 결과.
- images/: 추출한 PNG 원본.
- uploaded.json / etc-uploaded.json: 실제 등록 RUID와 설정 완료 기록.

## 포함 범위와 원본 한계

NPC·몬스터는 mon.dat 전체와 현재 npc_db.txt/mob_db.txt의 염색 변형을 포함했다. ETC는 TILE.DAT의 지형·오브젝트, BARAM.DAT의 감정표현, MISC.DAT의 기타 스프라이트, bint.dat의 UI 이미지, char.dat의 유령·사망 표시를 포함했다. 캐릭터 몸·머리·착용 부품은 이 작업 범위에 포함하지 않았다.

NPC/몬스터 정의 99건은 원본 이미지 범위와 맞지 않는다(이미지 번호 0 이하 15건, 674 초과 84건). 원본에 없는 그림은 생성하지 않았으며 목록을 보존했다.

UI 16개 EPF는 팔레트 연결을 확정하지 못해 원본 공용 팔레트별 변형을 보존했다. inventory.json의 uiPaletteEvidence에 근거와 한계를 기록했다.

등록물은 **개별 Sprite 프레임**이다. AnimationClip 생성 및 게임 스크립트 연결은 하지 않았다. 원본 동작 순서·지연·오프셋은 매핑 파일에 보존했다.

## Git 체크포인트

사용자 요청 시점의 추출물·등록 기록을 ef17c1e로 커밋했다. 원격 main을 충돌 없이 pull한 뒤 병합 커밋 **d1c7c3f**를 push했고, 로컬/원격 일치를 확인했다. 이후 업로드를 재개해 이 완료 결과와 매핑 파일을 로컬에 갱신했다.

## 도구

- upload-actors.cjs / upload-etc.cjs: 기존 RUID 기록을 건너뛰며 등록을 이어가는 도구. .codex/config.toml의 MSW MCP 연결 설정을 런타임에 읽는다.
- verify-and-map.cjs: 서버 전체 대조 후 RUID 매핑 생성. --actors-only는 NPC·몬스터만 검증한다.
- extract-etc.cjs: ETC 추출 재현 도구. 로컬 iced-x86 분석 의존성을 사용한다.
