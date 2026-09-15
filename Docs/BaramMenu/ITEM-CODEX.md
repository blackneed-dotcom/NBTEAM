# Item codex

Layout follows ui8.png: two columns, three rows, item art on the left and drop sources on the right. UI textures are composed from bint.dat/DLGMSG1.EPF with NPAL8.PAL; items use the existing MISC.DAT/Item.epf resources. No generated replacement art.

## Entries

| Entry | Runtime item ID | Original image ID | Requirement | Reward |
|---|---:|---:|---:|---|
| 도토리 | 3014 | 215 | 100 | Attack +1 |
| 토끼고기 | 3018 | 218 | 100 | Pending |
| 쥐고기 | 3019 | 289 | 100 | Pending |
| 박쥐고기 | 9028 | 289 | 100 | Pending |
| 뱀고기 | 3020 | 222 | 100 | Pending |
| 웅담 | 3032 | 221 | 100 | Pending |

Existing runtime IDs are retained for compatibility with saved inventories. Bat meat is added from the supplied item_db.txt entry 9028. Rat and bat meat intentionally share original image 289.

Drop names are grounded in monster/부여고구려성/{초보사냥터,쥐굴,뱀굴,곰호랑이굴}.txt. Regions are checked against mob_db.txt, mobspawn.txt and map_db.txt. These labels describe original-client sources; this change does not spawn additional hunting maps or monsters.

## Registration and saves

`BaramItemCodex` validates possession and remaining capacity on the server. A server-issued token is consumed once. Positive whole quantities up to the owned count and remaining target are accepted; other requests do not mutate inventory. Inventory consumption and codex progress change together without yielding. Existing trade locks apply.

Progress is `state.codex[itemId]`, saved with the existing character inventory through BaramWorld's dirty/revision/flush pipeline. Older saves without the field remain valid. Attack +1 is derived from acorn progress == 100 and added in BaramWorld.Attack, so it cannot be granted twice. Other entries currently grant no bonus.

## Verification

- Maker build logs: no build errors.
- Server-copy checks: 40 + 60 registration, stack-spanning consumption, 20 remaining from 120; JSON round-trip accepted by ValidState; attack bonus exactly 1.
- Empty inventory, zero, excess and post-completion registration rejected without mutation.
- All six entries consume 100; only acorns grant attack bonus.
- Actual UI clicks: menu → codex → register → quantity prompt → confirm. Temporary server-copy fixture at 99/100 consumed 1 acorn, completed 100/100, returned +1 and consumed the token. Original character state/dirty/revision were restored before testing ended; periodic saving was deferred during the fixture.
- Original map import LEA-3015 errors are unrelated and pre-existing.

Build UI with `node Docs/BaramMenu/build-codex.cjs`. Run it after menu rebuilds to restore the codex entry's touch components.
