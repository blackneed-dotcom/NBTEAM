# -*- coding: utf-8 -*-
"""winbaram.exe 들여다보기 도구."""
import sys
import pefile
import capstone

PATH = "/mnt/user-data/uploads/baramteam/winbaram.exe"
pe = pefile.PE(PATH)
BASE = pe.OPTIONAL_HEADER.ImageBase
data = open(PATH, "rb").read()

SECTIONS = []
for s in pe.sections:
    SECTIONS.append({
        "name": s.Name.decode().rstrip("\0"),
        "va": BASE + s.VirtualAddress,
        "size": max(s.Misc_VirtualSize, s.SizeOfRawData),
        "raw": s.PointerToRawData,
    })


def va_to_off(va):
    for s in SECTIONS:
        if s["va"] <= va < s["va"] + s["size"]:
            return s["raw"] + (va - s["va"])
    return None


def off_to_va(off):
    for s in SECTIONS:
        if s["raw"] <= off < s["raw"] + s["size"]:
            return s["va"] + (off - s["raw"])
    return None


md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
md.detail = True


def dis(va, count=60):
    off = va_to_off(va)
    if off is None:
        return []
    return list(md.disasm(data[off:off + count * 8], va, count))


def show(va, count=60):
    for ins in dis(va, count):
        print("0x%08X  %-24s %s %s" % (ins.address, ins.bytes.hex(), ins.mnemonic, ins.op_str))


def xrefs(target):
    """target 을 부르거나 가리키는 곳을 찾는다 (call/jmp rel32 + 절대주소 상수)."""
    out = []
    text = [s for s in SECTIONS if s["name"] == ".text"][0]
    start, size, raw = text["va"], text["size"], text["raw"]
    body = data[raw:raw + size]
    # call/jmp rel32
    for i in range(len(body) - 5):
        op = body[i]
        if op in (0xE8, 0xE9):
            rel = int.from_bytes(body[i + 1:i + 5], "little", signed=True)
            if start + i + 5 + rel == target:
                out.append(("call" if op == 0xE8 else "jmp", start + i))
    # 절대 주소 상수
    needle = target.to_bytes(4, "little")
    for s in SECTIONS:
        body2 = data[s["raw"]:s["raw"] + s["size"]]
        idx = 0
        while True:
            j = body2.find(needle, idx)
            if j < 0:
                break
            out.append(("ref:" + s["name"], s["va"] + j))
            idx = j + 1
    return out


if __name__ == "__main__":
    cmd = sys.argv[1]
    va = int(sys.argv[2], 16)
    if cmd == "d":
        show(va, int(sys.argv[3]) if len(sys.argv) > 3 else 60)
    elif cmd == "x":
        for kind, addr in xrefs(va):
            print("%-10s 0x%08X" % (kind, addr))
