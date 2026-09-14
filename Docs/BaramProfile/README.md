# 캐릭터 정보창
원본 폴더: C:/Users/black/UI. 원본 C/C++ 소스는 없어 winbaram.exe의 관련 UI 루틴과 DAT 내부 리소스를 대조했다.

## 수정 파일
- RootDesk/MyDesk/BaramHUD/BaramProfile.mlua (신규): 서버 검증 조회, 단일 창, 대상 수명, 원본 비트맵 글꼴.
- RootDesk/MyDesk/BaramWorld/BaramInput.mlua: S키를 자기 캐릭터 정보창에 연결.
- RootDesk/MyDesk/BaramWorld/BaramPlayerVisual.mlua: Body/Head에 네이티브 TouchReceiveComponent/TouchEvent 연결 및 해제.
- RootDesk/MyDesk/BaramHUD/BaramHUDController.mlua: 기존 정보 버튼으로 공개 정보창 닫기.
- ui/BaramProfile.ui (신규): UIBuilder 생성.
- Docs/BaramProfile/: 원본 변환기, UIBuilder 스크립트, PNG, 글꼴 폭, 출처와 검증 기록.
- BaramProfile.codeblock은 Maker Refresh가 생성했다. 직접 편집하지 않았다.
기존 BaramHUD.ui와 맵 이름 변경은 이번 기능에서 수정하지 않았다.

## 동작
자신 또는 다른 실제 사용자 선택 시 서버가 두 사용자의 접속/입장/같은 맵을 확인하고 닉네임, 성별, 머리, 실제 장착 아이템만 전달한다. 사용자 ID 없는 객체는 무시한다. S키와 자기 캐릭터 클릭은 동일한 창과 서버 조회 경로를 사용한다. 같은 대상 재클릭은 기존 창을 유지하고 다른 대상을 선택하면 기존 요청을 무효화한다. 정보 버튼/Esc로 닫는다. 대상이 사라지거나 맵을 떠나거나 입장을 종료하면 닫는다. 닫힌 후 도착한 응답과 이전 대상 응답은 무시한다. 0.5초마다 실제 데이터를 다시 조회한다.

## 원본과의 차이
- 현재 프로젝트에 교환 창과 그룹 시스템이 없어 해당 버튼은 원본 비활성 이미지로 표시한다. 동작은 미구현이다.
- 문파/문파 직함/직함/직업/소개/이력 데이터가 현재 프로젝트에 없어 빈 영역으로 둔다. 가짜 값과 HP/금전 등 원본 공개 정보창에 없는 항목은 추가하지 않았다.
- 장비는 현재 구현된 장착 아이템 17만 대응한다. 다른 장착 ID가 들어오면 대체 이미지를 쓰지 않고 누락 로그를 남긴다.
- 원본 USERLOOK.EPF에는 X 닫기 이미지가 없다. 새 X 디자인을 만들지 않고 기존 HUD 정보 버튼과 Esc를 사용한다.
- 기존 640×480 HUD의 3×2.25 화면 배율을 따른다. 실제 원본 클라이언트 실행 화면과 픽셀 단위 동일성은 인증하지 않았다. 공개 정보창 원본 프레임/좌표/비트맵 글꼴을 Maker 화면과 대조했다.
- 원본 폰트에 없는 문자는 원본 물음표 글리프로 표시한다.

## 검증
- Maker Refresh 후 빌드 오류 0. 기존 채팅 코드의 LWA-1111 경고 2건은 유지.
- Play에서 실제 로컬 사용자 데이터를 렌더러에 전달해 이름/외형 및 원본 프레임/글꼴 표시 확인. 이는 다른 사용자 조회 검증을 대신하지 않는다.
- Maker mouse_input으로 다음/이전 페이지 및 정보 버튼 닫기 확인. keyboard_input으로 Esc 닫기 확인.
- 잘못된 대상 서버 RPC 거부, ID 없는 객체 무시, 이전 대상 응답 무시, 닫힌 뒤 지연 응답 무시, 대상 참조 소멸 시 닫기 확인.
- 최종 수정 후 실행과 종료 로그 오류 0.
- 접속자는 1명이다. 서로 다른 실제 사용자 클릭 → 서버 조회 → 정보 표시, 실제 사용자 사이 대상 변경, 실제 사용자 퇴장 통합 검증은 미완료다.
- 테스트 복제 객체에서 네이티브 수신기 2개가 연결됨을 확인했다. 복제 객체는 실제 사용자가 아니며 테스트 후 제거했다.
- 초기 투명 버튼 클릭 실패는 원본 활성/비활성 버튼을 직접 표시하도록 수정 후 재검증했다. 초기 복제 객체의 nil UserId 처리도 수정했다.

## 원본 → RUID
세부 팔레트/프레임/변환 좌표는 manifest.json에 기록한다. 원본 DAT와 EXE는 수정하지 않았다.

| 원본 파일 / 프레임 | MSW RUID |
|---|---|
| bint.dat/USERLOOK.EPF / frame 0 | 2bdbd74b099240488bfd24774007c8eb |
| bint.dat/SELFLOK3.EPF / frame 0 | 0ae88f3ef57c492ab841874911b35e5e |
| bint.dat/LOOKBTN.EPF / frame 3 | fd6663ce5da040e3b60faf1483e4da70 |
| bint.dat/LOOKBTN.EPF / frame 4 | bafbc55602264393b8c45a2663290632 |
| bint.dat/SPELLBUT.EPF / frame 0 | e67ebcd71ac847ca818b7cd64bee797e |
| bint.dat/SPELLBUT.EPF / frame 1 | 922c0e04346649118a7aeaa2f0575b54 |
| bint.dat/SPELLBUT.EPF / frame 2 | 74806d9db63f4bc1a7dc8fdbc1c193a3 |
| bint.dat/SPELLBUT.EPF / frame 3 | c2da3fcf480343debca0350d61f9926f |
| bint.dat/BARAM00.EFT / page 0 | 8dbe6b05e5a7497b8018f657504d5fa0 |
| bint.dat/BARAM00.EFT / page 1 | 5af4b8c835d440a4bee488975c20f0a8 |
| bint.dat/BARAM00.EFT / page 2 | c5f8ba086ea7441583a72f1bd2b9f2f0 |
| bint.dat/BARAM00.EFT / page 3 | ef1a9134d2924e5aa803868fa6b077f3 |
| char.dat/BODY.EPF / frame 6 | c64b25f16d014f5284f06b2ed46e7052 |
| char.dat/BODY.EPF / frame 110 | 5a0e3745d4f24769af2558adfcf52378 |
| char.dat/Head.EPF / frame 6 | 3d16bf20f98748b8a7a2fb67ad1256c4 |
| char.dat/Head.EPF / frame 106 | b254a7f33d4d4041bbc28fa442fe7174 |
| char.dat/Head.EPF / frame 206 | 368df95b9ccf48f08476ea29a8ea26cd |
| char.dat/Head.EPF / frame 306 | 16f9bfd585f34ab49faad428b1bb568a |
| char.dat/Head.EPF / frame 406 | 68e17bac3eda4a479a68d4304201d64f |
| char.dat/Head.EPF / frame 506 | c1784502e7b5424e97a90ae6a7ca476d |
| char.dat/Head.EPF / frame 606 | c67518162cf246a6a9323eec42b2ac99 |
| char.dat/Head.EPF / frame 706 | 5dfee0c94aa441d794c9bf5269805857 |
| char.dat/Head.EPF / frame 806 | 907822864a0b4d568ebe902fad23289e |
| char.dat/Head.EPF / frame 906 | ddcfbd4ccee342eab23820168ba4b841 |
| MISC.DAT/item.epf / frame 2 | 53fbd0a9bed24c72b53ac3def57d85ac |
| ui1.png / existing-HUD-info-button | 230e51d8c4f0448c97024131a81500cd |

## 자기 캐릭터 / S키 추가 검증
Maker Refresh 후 빌드 오류 0. Play에서 S키와 네이티브 자기 캐릭터 클릭으로 서버에서 받은 동일한 실제 이름/외형 데이터 표시를 확인했다. S키 반복, 재클릭은 같은 창을 유지하며 Esc 닫기까지 통과했다. 런타임 오류 0. UI와 리소스 변경 없음.

## 로그인 자동 표시 / 초상화 위치 조정
월드 입장 완료 후 입력 대기 해제 시 자신의 정보창을 한 번 자동으로 연다. 닫은 창은 같은 로그인 중 다시 자동으로 열리지 않는다. Body/Head를 UIBuilder로 원본 좌표 기준 10픽셀 아래([72,-110])로 이동했다. Play에서 로그인 자동 표시, 두 레이어 위치, Esc 닫기 유지, S 재열기 확인. 빌드/런타임 오류 0.

## 추가 2픽셀 / 창 가림 수정
Body/Head를 [72,-112]로 2픽셀 더 내렸다(UIBuilder). OpenInventory에서 BaramProfile.Close를 호출하며 OpenSkills도 같은 경로를 사용한다. I → S → K 입력으로 정보창/인벤토리/스킬 상호 전환 확인. 빌드/런타임 오류 0. 리소스 변경 없음.

## 이름 색상 / 무기 설명
이름 글리프를 검정색으로 변경. 사용자 지정 형식인 `w 무기: `를 하단 장비 설명 영역에 추가하고 서버의 실제 장착 아이템 이름을 연결했다. 미장착이면 접두어만 표시한다. 기존 원본 BARAM00.EFT 글리프/RUID를 사용한다. Play에서 검정색, 무기 줄 활성, 현재 미장착 상태와 응답 일치를 확인. 현재 소지품에 무기가 없어 실제 장착 전환 테스트는 수행하지 않았다. 빌드/런타임 오류 0.
