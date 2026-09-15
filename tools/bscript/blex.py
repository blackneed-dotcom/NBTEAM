# -*- coding: utf-8 -*-
"""바람 스크립트 토크나이저."""
import re

KEYWORDS = {"if", "else", "while", "for", "switch", "case", "default",
            "break", "continue", "goto", "return", "end", "set"}

TOKEN_RE = re.compile(r"""
    (?P<ws>\s+)
  | (?P<lcomment>//[^\n]*)
  | (?P<bcomment>/\*.*?\*/)
  | (?P<str>"(?:\\.|[^"\\])*")
  | (?P<num>\d+(?:\.\d+)?)
  | (?P<var>(?:\$@|\.@|[@$\#.])[A-Za-z0-9_'가-힣]+\$?)
  | (?P<name>[A-Za-z_가-힣][A-Za-z0-9_'가-힣]*\$?)
  | (?P<op><<|>>|&&|\|\||==|!=|<=|>=|[-+*/%<>!&|^=~])
  | (?P<punc>[(){}\[\],;:])
""", re.X | re.S)


class Token:
    __slots__ = ("kind", "text", "line")

    def __init__(self, kind, text, line):
        self.kind = kind
        self.text = text
        self.line = line

    def __repr__(self):
        return "%s(%r)@%d" % (self.kind, self.text, self.line)


class LexError(Exception):
    pass


def tokenize(src):
    out = []
    pos = 0
    line = 1
    n = len(src)
    while pos < n:
        m = TOKEN_RE.match(src, pos)
        if not m:
            raise LexError("line %d: 알 수 없는 글자 %r" % (line, src[pos:pos + 20]))
        kind = m.lastgroup
        text = m.group()
        if kind in ("ws", "lcomment", "bcomment"):
            line += text.count("\n")
            pos = m.end()
            continue
        if kind == "name" and text in KEYWORDS:
            kind = "kw"
        out.append(Token(kind, text, line))
        line += text.count("\n")
        pos = m.end()
    out.append(Token("eof", "", line))
    return out
