# Codex file-tool fallback

When running in Codex and dedicated Read, Glob, or Grep tools are unavailable, Codex may use `exec_command` or JavaScript filesystem APIs to read files and use `rg` / `rg --files` to search file contents and paths.

This exception applies to workspace exploration and reading AGENTS.md, SKILL.md, and skill reference files, including initial skill routing and Foundation loading. Prefer dedicated tools when available. Use explicit paths; for shell commands, use forward-slash, double-quoted paths.

This exception does not relax requirements to read applicable instructions and skills before implementation or authorize destructive operations.

## 대화 및 작업 재개

새 세션에서 이 프로젝트 작업을 시작할 때, 먼저 다음 기록을 읽고 기존 결정과 완료/미완료 상태를 확인한다:

- [대화 및 작업 기록](Docs/ConversationRecovery/2026-09-16/inventory-equipment-ui-experience-session.md)

기록은 과거 맥락이며 최신 사용자 지시가 우선한다. 완료된 작업을 반복하지 말고 현재 파일 상태와 대조한다. 경험치 6~99레벨 변경은 기록 작성 당시 미적용이며, 누적 기준값 10배와 구간 필요량 10배를 혼동하지 않는다. 사용자가 이어서 작업할 때 현재 요청과 관련된 마지막 상태를 짧게 안내한다.
