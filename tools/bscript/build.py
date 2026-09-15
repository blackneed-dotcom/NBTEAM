# -*- coding: utf-8 -*-
"""고른 주문만 골라 mlua 로 뽑는다."""
import glob
import os
import sys
import collections
import bparse
import emit

ROOT = "/mnt/user-data/uploads/baramteam"
FILES = sorted(glob.glob(os.path.join(ROOT, "magic/**/*.txt"), recursive=True))
FILES += sorted(glob.glob(os.path.join(ROOT, "function/*.txt")))
FILES += [os.path.join(ROOT, "script_essential.txt"), os.path.join(ROOT, "script_timer.txt")]


def load():
    blocks = {}
    where = {}
    for path in FILES:
        src = open(path, "rb").read().decode("cp949", "replace")
        if not src.strip():
            continue
        short = os.path.relpath(path, ROOT)
        for b in bparse.Parser(src, short).parse_file():
            if b["name"] in blocks:
                continue  # 먼저 나온 쪽을 쓴다(원본도 그렇게 덮어쓴다)
            blocks[b["name"]] = b["body"]
            where[b["name"]] = "%s:%d" % (short, b["line"])
    return blocks, where


def calls_in(body):
    out = set()

    def walk(n):
        if isinstance(n, list):
            if n and n[0] in ("cmd", "call") and n[1] == "callfunc" and n[2] and n[2][0][0] == "str":
                out.add(n[2][0][1])
            for x in n:
                walk(x)
    walk(body)
    return out


def closure(blocks, entries):
    seen = []
    missing = set()
    queue = list(entries)
    done = set()
    while queue:
        name = queue.pop(0)
        if name in done:
            continue
        done.add(name)
        body = blocks.get(name)
        if body is None:
            missing.add(name)
            continue
        seen.append(name)
        for f in calls_in(body):
            target = "FUNC_" + f if "FUNC_" + f in blocks else f
            queue.append(target)
    return seen, missing


def main(entries):
    blocks, where = load()
    order, missing = closure(blocks, entries)
    e = emit.Emitter(blocks)
    lines = []
    skipped = []
    for name in order:
        e.out = []
        try:
            emit.emit_block(name, blocks[name], e, "        ")
        except emit.Unsupported as err:
            skipped.append((name, str(err)))
            continue
        lines.extend(e.out)

    print("뽑은 블록 %d개, 못 뽑은 것 %d개, 없는 함수 %d개" %
          (len(order) - len(skipped), len(skipped), len(missing)))
    for n, r in skipped:
        print("   건너뜀:", n, "-", r)
    for n in sorted(missing):
        print("   없음:", n)
    print("\n필요한 명령 %d종:\n   %s" % (len(e.used_cmds), ", ".join(sorted(e.used_cmds))))
    print("\n필요한 함수 %d종:\n   %s" % (len(e.used_funcs), ", ".join(sorted(e.used_funcs))))
    return lines


if __name__ == "__main__":
    entries = sys.argv[1:] or ["@백열장"]
    out = main(entries)
    open("/tmp/claude-0/out.lua", "w", encoding="utf-8").write("\n".join(out))
