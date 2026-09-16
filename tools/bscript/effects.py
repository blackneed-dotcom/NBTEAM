# -*- coding: utf-8 -*-
"""resource-map.json -> BaramEffectData.mlua

동업자가 올린 efx.dat 프레임과 EFFECT.TBL 의 재생 순서를 하나로 묶는다.
원본 스크립트의 `effect @id, 86` 에서 86 이 여기 번호다.
"""
import json
import os
import sys
import uuid

PER_METHOD = 40


def write_codeblock(path, name, kind):
    guid = str(uuid.uuid4())
    data = {
        "Id": "", "GameId": "", "EntryKey": "codeblock://" + guid,
        "ContentType": "x-mod/codeblock", "Content": "",
        "Usage": 0, "UsePublish": 1, "UseService": 0,
        "CoreVersion": "26.7.0.0", "StudioVersion": "", "DynamicLoading": 0,
        "ContentProto": {"Use": "Json", "Json": {
            "CoreVersion": {"Major": 0, "Minor": 2},
            "ScriptVersion": {"Major": 1, "Minor": 1},
            "Description": "", "Id": guid, "Language": 1,
            "Name": name, "Type": kind, "Source": 0, "Target": None,
        }},
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main(map_path, out_path):
    d = json.load(open(map_path, encoding="utf-8"))
    frames_by_key = {}
    for a in d["assets"]:
        if a.get("subcategory") != "skill":
            continue
        s = a.get("source", {})
        frames_by_key[(s.get("entry"), s.get("frame"))] = s

    rows = []
    total = 0
    missing = 0
    for effect in d["effects"]:
        parts = []
        for f in effect["frames"]:
            s = frames_by_key.get(("effect.epf", f["frameIndex"]))
            if s is None:
                missing += 1
                continue
            parts.append('{r="%s",d=%d,x=%d,y=%d,w=%d,h=%d}' % (
                f["ruid"], int(f["delayMs"]), s["left"], s["top"], s["width"], s["height"]))
            total += 1
        if parts:
            rows.append((effect["id"], "{" + ",".join(parts) + "}"))

    chunks = [rows[i:i + PER_METHOD] for i in range(0, len(rows), PER_METHOD)]
    body = []
    for index, chunk in enumerate(chunks):
        body.append('    @ExecSpace("ClientOnly")')
        body.append("    method void Part%d(table E)" % (index + 1))
        for eid, text in chunk:
            body.append("        E[%d] = %s" % (eid, text))
        body.append("    end")
        body.append("")
    calls = "".join("        self:Part%d(E)\n" % (i + 1) for i in range(len(chunks)))

    head = '''-- 이 파일은 손으로 고치지 마라. tools/bscript/effects.py 가 뽑는다.
--   python3 tools/bscript/effects.py Docs/BaramResourcePack/resource-map.json <나올 파일>
--
-- 원본 스크립트의 `effect @id, 86` 에서 86 이 여기 번호다.
-- 한 칸: r=그림, d=머무는 밀리초, x/y=원본 EPF 의 잘린 경계(발밑 기준, y 는 아래로 +),
--        w/h=그림 크기(픽셀). 100픽셀이 월드 1이다.
@Logic
script BaramEffectData extends Logic
    @ExecSpace("ClientOnly")
    method table All()
        if self._T.effects ~= nil then return self._T.effects end
        local E = {}
%s        self._T.effects = E
        return E
    end

    -- 스크립트가 부르는 번호와 EFFECT.TBL 의 번호가 하나 어긋난다.
    -- 아이템도 같다("아이템 DB의 이미지 번호는 프레임 번호 + 1이다" — 리소스팩 README).
    -- 백열장이 effect 86 을 부르는데 손바닥 그림은 표의 85번이다.
    property integer NumberOffset = -1

    @ExecSpace("ClientOnly")
    method table Get(integer id)
        return self:All()[id + self.NumberOffset]
    end

''' % calls

    text = head + "\n".join(body) + "end\n"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    code = os.path.splitext(out_path)[0] + ".codeblock"
    if not os.path.exists(code) or os.path.getsize(code) < 200:
        write_codeblock(code, "BaramEffectData", 5)
    print("효과 %d개, 프레임 %d개, 못 찾은 프레임 %d개 -> %s (%d바이트)" %
          (len(rows), total, missing, out_path, len(text)))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
