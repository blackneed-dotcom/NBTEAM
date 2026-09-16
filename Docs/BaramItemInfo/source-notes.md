# Original inventory information popup

Source: local `winbaram.exe` and `bint.dat`, inspected statically.

- Inventory input at 0x451485 / 0x45161C sends packet 0x1C with the slot.
- Response packet 0x59 reaches 0x451720; it creates popup 0x441A70, timeout 10000ms.
- Constructor measures text, adds 10px horizontal padding and line height + 9px vertical padding, and clamps to bounds.
- Draw function 0x441DD0 uses background palette index 1, outline index 0x80, text index 0x8F, text inset 5px.
- `bint.dat/BARAM.PAL` supplies RGB 1=(0,0,171), 128=(0,0,0), 143=(255,255,255).
- This popup does not load `MSGBORD.EPF`. That resource belongs to another window at 0x4BD567.

MSW uses the existing solid-color UI sprite, original palette colors, 1px outline, 5px text inset, content sizing, and the existing 10-second timeout. Font metrics come from the project's Galmuri11 font.
