# -*- coding: utf-8 -*-
"""블록끼리 부르는 이름이 실제로 있는지 맞춰본다."""
import glob
import os
import collections
import bparse

ROOT = "/mnt/user-data/uploads/baramteam"
FILES = sorted(glob.glob(os.path.join(ROOT, "magic/**/*.txt"), recursive=True))
FILES += sorted(glob.glob(os.path.join(ROOT, "function/*.txt")))
FILES += [os.path.join(ROOT, "script_essential.txt"), os.path.join(ROOT, "script_timer.txt")]

defined = set()
trees = []
for path in FILES:
    src = open(path, "rb").read().decode("cp949", "replace")
    if not src.strip():
        continue
    short = os.path.relpath(path, ROOT)
    tree = bparse.Parser(src, short).parse_file()
    trees.append((short, tree))
    for b in tree:
        defined.add(b["name"])

callfunc = collections.Counter()
runscript = collections.Counter()
gotos = collections.Counter()
labels_missing = []


def walk(node, labels, used_labels):
    if not isinstance(node, list):
        return
    if node and node[0] == "cmd":
        name, args = node[1], node[2]
        if name == "callfunc" and args and args[0][0] == "str":
            callfunc[args[0][1]] += 1
        if name == "runscript" and args and args[0][0] == "str":
            runscript[args[0][1]] += 1
    if node and node[0] == "label":
        labels.add(node[1])
    if node and node[0] == "goto":
        used_labels.add(node[1])
        gotos[node[1]] += 1
    for x in node:
        walk(x, labels, used_labels)


for short, tree in trees:
    for b in tree:
        labels, used = set(), set()
        walk(b["body"], labels, used)
        for u in used - labels:
            labels_missing.append((short, b["name"], u))

missing_func = sorted(n for n in callfunc if "FUNC_" + n not in defined and n not in defined)
print("callfunc 대상 %d종, 그중 못 찾는 것 %d종" % (len(callfunc), len(missing_func)))
for n in missing_func:
    print("   없음: %-30s (%d번 호출)" % (n, callfunc[n]))

print("\nrunscript 대상 %d종:" % len(runscript))
for n, c in runscript.most_common(20):
    print("   %-30s %d  %s" % (n, c, "" if n in defined or "FUNC_" + n in defined else "<- 없음"))

print("\ngoto 인데 라벨이 없는 곳 %d건:" % len(labels_missing))
for f, b, u in labels_missing[:15]:
    print("   %s / %s -> %s" % (f, b, u))
