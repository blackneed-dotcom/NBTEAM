# Separate equipment and parchment item information

Previous completed work pushed first: 401829f134d6f84c9a2481e8c686454657802008 (origin/main).

- Weapon instance is stored at state.equipment.weapon; state.items contains bag items only. Legacy state.equip slot migrates once on character entry and becomes 0.
- Equip removes the bag entry. Replacing a weapon puts the old weapon into the selected bag slot. Unequip places the complete instance into the first free bag slot; a full bag rejects without item loss.
- Saved names/durability and all item fields remain intact. Weapon attack, profile and original script queries use the shared Equipped accessor.
- Tooltip uses resource-pack BINT/MSGBORD palette 0 frames 0,1,2,3,5,7,8,9, with dark text and paper fill. Right-click toggle is preserved.
- Durability loss remains disabled. Death values and training staff/sword worn images remain excluded.
