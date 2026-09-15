# NPC·몬스터·ETC 그룹 리소스 가져오기

대상 그룹: FqXhK. 원본: C:/Users/black/UI.

## 현재 체크포인트

- 추출 완료: 원본 프레임·팔레트·염색 조합 91,015개 → 중복 제거 이미지 83,008개.
- NPC 4,461개, 몬스터 17,972개, 배경 27,809개, 오브젝트 29,461개, 기타 3,305개.
- NPC·몬스터 등록 확인: 12,151 / 22,433개. 세 항목의 등록 API 오류를 재확인해야 한다.
- ETC 등록 확인: 6,822 / 60,575개. 네 항목의 픽셀 필터 설정이 남아 있다.
- 사용자 요청에 따라 이 체크포인트에서 Git pull/push 후 업로드를 재개한다. 전체 업로드 완료 기록이 아니다.

## 파일

- images/: 추출 PNG.
- inventory.json: 원본 해시, 전체 작업 목록, 프레임 오프셋·팔레트, NPC/몬스터 정의, 동작 및 오브젝트 구성.
- uploaded.json / etc-uploaded.json: 서버에서 확인한 RUID.
- upload-status.json / etc-upload-status.json: 진행 상태와 오류.
- extraction-validation.json: 83,008개 전수 PNG CRC·해제 크기·해시 검사 통과.
- extract-etc.cjs: ETC 재현 도구. 로컬 iced-x86 분석 의존성을 사용한다.

NPC·몬스터는 mon.dat 전체를 대상으로 현재 npc_db.txt/mob_db.txt의 염색 변형을 포함했다. ETC 범위는 TILE.DAT의 지형·오브젝트, BARAM.DAT의 감정표현, MISC.DAT의 기타 스프라이트, bint.dat의 UI 이미지, char.dat의 유령·사망 표시다. 캐릭터 몸·머리·착용 부품은 이 목록에 포함하지 않았다.

NPC/몬스터 정의 99건은 원본 이미지 범위와 맞지 않는다(이미지 번호 0 이하 15건, 674 초과 84건). inventory.json의 missingActorDefinitions에 보존한다. 원본에 없는 그림을 생성하지 않았다.

UI 16개 파일은 실제 팔레트 연결을 확정하지 못해 원본 공용 팔레트별 변형을 보존했다. uiPaletteEvidence에 명시했다. 모든 자료는 개별 Sprite 프레임이며 AnimationClip 생성과 게임 스크립트 연결은 별도다.
