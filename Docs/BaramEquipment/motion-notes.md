# Equipment behavior and original motion mapping

- Superseded by separate-equipment.md: equipped items move out of the bag into state.equipment.weapon; unequip returns the item to a free bag slot. Existing Shift+T → W unequips weapons.
- DurabilityLossEnabled defaults to false; attack and durable consumable wear are gated.
- winbaram.exe 0x446FC0: equip image families <10000 sword, <20000 spear, <30000 bow, <40000 fan.
- 0x52C1F4 idle/walk bases: 0,12,32,52,12; 0x52C208 attack bases:24,24,44,64,24.
- Head follows body frame; held layer uses 0..11 walking and 12..19 attack. Other actions hide held layer.
- Original Head.EPF missing bindings:166 references,83 PNGs added,96x96 canvas foot(48,72).
- Death field and training staff/sword worn images remain excluded per user.
