# -*- coding: utf-8 -*-
"""spell_db 의 주문이 실제로 스크립트를 갖고 있는지 맞춰본다."""
import glob
import os
import collections
import bparse

ROOT = "/mnt/user-data/uploads/baramteam"
FILES = sorted(glob.glob(os.path.join(ROOT, "magic/**/*.txt"), recursive=True))
FILES += sorted(glob.glob(os.path.join(ROOT, "function/*.txt")))
FILES += [os.path.join(ROOT, "script_essential.txt"), os.path.join(ROOT, "script_timer.txt")]

defined = {}
orphan_lines = 0
for path in FILES:
    src = open(path, "rb").read().decode("cp949", "replace")
    if not src.strip():
        continue
    short = os.path.relpath(path, ROOT)
    p = bparse.Parser(src, short)
    tree = p.parse_file()
    orphan_lines += len(p.orphans)
    for b in tree:
        defined.setdefault(b["name"], []).append("%s:%d" % (short, b["line"]))

print("정의된 블록 이름 %d개 (중복 포함 %d)" %
      (len(defined), sum(len(v) for v in defined.values())))
dupes = {k: v for k, v in defined.items() if len(v) > 1}
print("이름이 겹치는 블록 %d개" % len(dupes))
for k, v in list(dupes.items())[:10]:
    print("   ", k, "->", ", ".join(v))
print("주석 처리된 블록에서 남은 고아 토큰 줄 수:", orphan_lines)

# spell_db
spells = []
for line in open(os.path.join(ROOT, "spell_db.txt"), "rb").read().decode("cp949", "replace").split("\n"):
    line = line.strip()
    if not line or line.startswith("//") or line.startswith("@"):
        continue
    parts = line.split()
    if len(parts) < 4 or not parts[0].isdigit():
        continue
    spells.append(parts)

have = 0
missing = []
for s in spells:
    cast = s[3]
    if cast.startswith("@") and cast in defined:
        have += 1
    elif cast.startswith("@"):
        missing.append((s[1], cast))
print("\nspell_db 주문 %d개 중 cast 스크립트가 있는 것 %d개, 없는 것 %d개" %
      (len(spells), have, len(missing)))
for n, c in missing[:25]:
    print("   없음:", n, c)

funcs = [k for k in defined if not k.startswith("@")]
print("\n@ 아닌 블록(함수/훅) %d개:" % len(funcs))
print("   " + ", ".join(sorted(funcs)[:60]))
