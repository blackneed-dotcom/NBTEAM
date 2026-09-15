# 클라이언트 아이템·마법 이미지 그룹 리소스

대상 그룹: `FqXhK`. 원본 위치: `C:/Users/black/UI`.

## 범위

- MISC.DAT/Item.epf: 전체 2,474프레임. Item.tbl에서 각 프레임의 팔레트 번호를 읽었다.
- 아이템 염색: 현재 item_db.txt 및 기존 프로젝트 분석본에서 참조한 변형을 포함해 총 2,956개.
- efx.dat: EFFECT 2,487, CHREFX 12, FRMLEFX 43, FRMREFX 43, ITEMEFX 12, MAGEFX 12. 총 2,609프레임.
- 합계 5,565개 PNG. 투명한 원본 프레임도 인덱스 보존을 위해 포함했다.

## 그룹에서 찾기

Resource Storage의 그룹 리소스에서 다음 이름으로 검색한다.

- 아이템: `BaramClient_Item_` (Sprite / Item)
- 마법·보조 이펙트: `BaramClient_Magic_` (Sprite / Skill)
- `F00000`은 0부터 시작하는 원본 EPF 프레임 번호다. 아이템 DB의 이미지 번호는 프레임 번호 + 1이다.
- `P00`은 원본 팔레트 번호, `D5` 등의 접미사는 염색 값이다. 접미사가 없으면 염색 0이다.

## 산출물

- images/: 손실 없이 변환한 개별 PNG.
- inventory.json: 원본 해시, 프레임 위치·크기·팔레트·염색, 현재 아이템 ID 연결, 원본 테이블.
- uploaded.json: 서버가 반환한 실제 RUID와 버전.
- resource-map.json: 전체 이미지와 RUID 대응표 및 원본 효과 시퀀스(등록 완료 후 생성).
- extraction-validation.json: 전수 PNG CRC·해제 크기 검사와 프레임 수 대조.
- remote-validation.json: 그룹 서버 목록 전수 대조(등록 완료 후 생성).
- decode.cjs: DAT/EPF/PAL/TBL 해독 함수. 원본 파일을 수정하지 않는다.

## 범위와 제한

이펙트는 개별 **프레임 이미지(Sprite)**로 등록했다. **AnimationClip 생성이나 게임 스크립트 연결은 하지 않았다.** EFFECT.TBL의 214개 항목에 포함된 프레임 순서, 지연 시간, 두 프레임 블록의 개수와 미해석 필드를 원형대로 보존했다. 원본 렌더러의 혼합/투명도/특수 효과를 재현했다고 간주하지 않는다.

현재 item_db.txt에서 206개 아이템 행이 현재 Item.epf 범위를 벗어난 120종의 이미지 번호를 참조한다. 해당 이미지 데이터는 제공된 원본팩에 없으므로 대체 이미지를 만들지 않았다. 상세 목록은 inventory.json의 missingItems다. 과거 분석본의 아이템 번호는 snapshotItemIds로 구분했다.

원본 EPF의 잘린 이미지 경계(left/top)는 매니페스트와 리소스 설명에 보존했다. 배치 시 이 오프셋을 적용해야 원본 위치를 재현할 수 있다. 픽셀 필터는 point, wrap은 clamp로 등록한다.

## 형식 참고

[TkViewer 원본 구현](https://github.com/DizzyThermal/TKViewer): DAT/EPF/PAL/FRM 형식 및 TBL 정수 해독. 이 클라이언트의 Effect.tbl은 7개 int 헤더 뒤에 header[1] + header[4]개의 16바이트 프레임 레코드가 이어지는 것을 전체 48,892바이트 소비 검사로 확인했다.
