# -*- coding: utf-8 -*-
"""모든 바람 스크립트를 읽어서 파싱되는지 센다."""
import glob
import os
import sys
import collections
import bparse
import blex

ROOT = "/mnt/user-data/uploads/baramteam"

FILES = sorted(glob.glob(os.path.join(ROOT, "magic/**/*.txt"), recursive=True))
FILES += sorted(glob.glob(os.path.join(ROOT, "function/*.txt")))
FILES += [os.path.join(ROOT, "script_essential.txt"), os.path.join(ROOT, "script_timer.txt")]

ok_files = 0
bad = []
blocks = 0
cmds = collections.Counter()
calls = collections.Counter()
names = collections.Counter()

for path in FILES:
    raw = open(path, "rb").read()
    try:
        src = raw.decode("cp949")
    except UnicodeDecodeError:
        src = raw.decode("cp949", "replace")
    if not src.strip():
        continue
    short = os.path.relpath(path, ROOT)
    try:
        tree = bparse.parse(src, short)
    except (bparse.ParseError, blex.LexError) as e:
        bad.append((short, str(e)))
        continue
    ok_files += 1
    blocks += len(tree)

    def walk(node):
        if isinstance(node, list):
            if node and node[0] == "cmd":
                cmds[node[1]] += 1
            elif node and node[0] == "call":
                calls[node[1]] += 1
            elif node and node[0] == "name":
                names[node[1]] += 1
            for x in node:
                walk(x)
        elif isinstance(node, dict):
            walk(node["body"])

    walk(tree)

print("파일 %d/%d 통과, 블록 %d개" % (ok_files, len(FILES), blocks))
if bad:
    print("\n실패:")
    for f, e in bad:
        print("  ", f, "->", e)
print("\n명령 %d종:" % len(cmds))
for k, v in cmds.most_common():
    print("   %-24s %d" % (k, v))
print("\n함수 %d종:" % len(calls))
for k, v in calls.most_common():
    print("   %-24s %d" % (k, v))
if names:
    print("\n맨이름(상수?) %d종:" % len(names))
    for k, v in names.most_common(40):
        print("   %-24s %d" % (k, v))
