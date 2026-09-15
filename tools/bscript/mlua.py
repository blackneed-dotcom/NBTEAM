# -*- coding: utf-8 -*-
"""고른 주문을 메이플월드 mlua 파일로 뽑는다."""
import json
import os
import sys
import build
import emit

# 한 메서드에 너무 많이 넣으면 루아 함수 하나가 커져서 위험하다. 나눠 담는다.
PER_METHOD = 40

HEADER = '''-- 이 파일은 손으로 고치지 마라. tools/bscript 가 원본 스크립트에서 뽑는다.
--   python3 tools/bscript/mlua.py %s
-- 원본: magic/*, function/*, script_essential.txt
@Logic
script BaramSpellScripts extends Logic
'''

FOOTER = '''    @ExecSpace("ServerOnly")
    method table Build(table R, table B)
        local S = {}
%s        return S
    end
end
'''


def main(entries, out_path):
    blocks, where = build.load()
    order, missing = build.closure(blocks, entries)
    e = emit.Emitter(blocks)
    parts = []
    current = []
    skipped = []
    for name in order:
        e.out = []
        try:
            emit.emit_block(name, blocks[name], e, "        ")
        except emit.Unsupported as err:
            skipped.append((name, str(err)))
            continue
        current.append((name, e.out))
        if len(current) >= PER_METHOD:
            parts.append(current)
            current = []
    if current:
        parts.append(current)

    body = []
    for i, part in enumerate(parts):
        body.append('    @ExecSpace("ServerOnly")')
        body.append("    method void Part%d(table S, table R, table B)" % (i + 1))
        for name, lines in part:
            body.append("        -- %s  (%s)" % (name, where.get(name, "?")))
            body.extend(lines)
        body.append("    end")
        body.append("")

    calls = "".join("        self:Part%d(S, R, B)\n" % (i + 1) for i in range(len(parts)))
    text = HEADER % " ".join(entries) + "\n".join(body) + "\n" + FOOTER % calls
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)

    code = os.path.splitext(out_path)[0] + ".codeblock"
    with open(code, "w", encoding="utf-8") as f:
        json.dump({"Name": "BaramSpellScripts"}, f, ensure_ascii=False, indent=4)

    print("블록 %d개 -> %s (%d줄)" % (len(order) - len(skipped), out_path, len(text.split("\n"))))
    if skipped:
        print("건너뜀:", skipped)
    if missing:
        print("원본에 없는 함수:", sorted(missing))
    print("명령:", ", ".join(sorted(e.used_cmds)))
    print("함수:", ", ".join(sorted(e.used_funcs)))


if __name__ == "__main__":
    args = sys.argv[1:]
    out = args[0]
    main(args[1:], out)
