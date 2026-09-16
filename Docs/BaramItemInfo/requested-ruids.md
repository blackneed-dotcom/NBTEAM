# Requested UI resources

- Item right-click information: d02588e51280413b8f79b32428b780c9 (BINT/DLGDIAL frame0 palette8,284x187).
- Original source is unchanged. Two rectangular UI masks render source rows 0..131 and153..186, omitting the baked CANCEL region. No CANCEL control is created. Text retains24px padding and the existing right-click toggle.
- Menu Codex icon:19fde9464dc1456fa6cb5e9517ffd066 (MISC/SYMBOLS frame116 palette0). Existing touch handler retained; aspect ratio preserved.

Verification: UIBuilder validation passed for both files; Maker build errors=0; live exact RUID/resource-load and CANCEL crop checks passed.

Follow-up: background sprites tinted blue (0.08,0.20,1.0), opacity0.70; text is opaque white. CANCEL clipping retained.
Codex icon mappings restored: chicken9014 → e67e282ccff64cf59c678f705ea13ac8 (16x14); bat9028 → 752873165d1c4413b496dfae9acfcad6 (20x9). Source MISC/item.epf frames213/288 palette0.
