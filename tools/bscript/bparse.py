# -*- coding: utf-8 -*-
"""바람 스크립트 파서. 토큰 -> AST(중첩 리스트)."""
from blex import tokenize, Token


class ParseError(Exception):
    pass


BINARY = [
    ("||",),
    ("&&",),
    ("|",),
    ("^",),
    ("&",),
    ("==", "!="),
    ("<", ">", "<=", ">="),
    ("<<", ">>"),
    ("+", "-"),
    ("*", "/", "%"),
]


class Parser:
    def __init__(self, src, name="<script>"):
        self.toks = tokenize(src)
        self.i = 0
        self.name = name

    # --- 토큰 도우미 -------------------------------------------------
    @property
    def cur(self):
        return self.toks[self.i]

    def at(self, text):
        return self.cur.text == text

    def atkind(self, kind):
        return self.cur.kind == kind

    def take(self):
        t = self.toks[self.i]
        self.i += 1
        return t

    def expect(self, text):
        if self.cur.text != text:
            raise ParseError("%s:%d: %r 를 기대했는데 %r" %
                             (self.name, self.cur.line, text, self.cur.text))
        return self.take()

    def accept(self, text):
        if self.cur.text == text:
            self.i += 1
            return True
        return False

    # --- 최상위 -----------------------------------------------------
    def parse_file(self):
        blocks = []
        self.orphans = []
        while not self.atkind("eof"):
            # 블록 머리는 "이름 {" 뿐이다. 그게 아니면 주석 처리된 블록의
            # 남은 몸통(무브.txt 457줄 같은 것)이라 한 토큰씩 건너뛴다.
            if self.cur.kind not in ("name", "var") or self.toks[self.i + 1].text != "{":
                self.orphans.append(self.cur.line)
                self.take()
                continue
            t = self.take()
            self.expect("{")
            body = self.statements("}")
            self.expect("}")
            blocks.append({"name": t.text, "line": t.line, "body": body})
        return blocks

    def statements(self, stop):
        out = []
        while not self.at(stop) and not self.atkind("eof"):
            s = self.statement()
            if s is not None:
                out.append(s)
        return out

    # --- 문 ---------------------------------------------------------
    def statement(self):
        t = self.cur
        if t.text == "{":
            self.take()
            body = self.statements("}")
            self.expect("}")
            return ["block", body]
        if t.text == ";":
            self.take()
            return None
        if t.kind == "kw":
            if t.text == "if":
                return self.if_stmt()
            if t.text == "while":
                self.take()
                return ["while", self.expr(), self.statement()]
            if t.text == "for":
                return self.for_stmt()
            if t.text == "switch":
                return self.switch_stmt()
            if t.text in ("break", "continue", "end"):
                self.take()
                self.accept(";")
                return [t.text]
            if t.text == "return":
                self.take()
                value = None
                if not self.at(";"):
                    value = self.expr()
                self.accept(";")
                return ["return", value]
            if t.text == "goto":
                self.take()
                label = self.take().text
                self.accept(";")
                return ["goto", label]
            if t.text == "set":
                return self.set_stmt()
            if t.text in ("case", "default"):
                raise ParseError("%s:%d: switch 밖의 %s" % (self.name, t.line, t.text))
        # 라벨 정의:  NAME :
        if t.kind == "name" and self.toks[self.i + 1].text == ":":
            self.take()
            self.take()
            return ["label", t.text]
        return self.command_stmt()

    def simple_stmt(self):
        """for 의 초기식/증감식처럼 ; 를 안 먹는 문."""
        if self.at(";"):
            return None
        if self.cur.text == "set":
            return self.set_stmt(eat_semi=False)
        return self.command_stmt(eat_semi=False)

    def set_stmt(self, eat_semi=True):
        line = self.cur.line
        self.expect("set")
        target = self.expr()
        self.expect(",")
        value = self.expr()
        if eat_semi:
            self.accept(";")
        return ["set", target, value, line]

    def if_stmt(self):
        self.expect("if")
        # 원본 문법은 if 다음에 "식 하나"다. 괄호는 그 식의 일부일 뿐이라
        # if(A) || (B) || (C) { ... } 같이 헐겁게 쓴 곳도 그대로 읽힌다.
        cond = self.expr()
        then = self.statement()
        other = None
        if self.at("else"):
            self.take()
            other = self.statement()
        return ["if", cond, then, other]

    def for_stmt(self):
        self.expect("for")
        self.expect("(")
        init = self.simple_stmt()
        self.expect(";")
        cond = None if self.at(";") else self.expr()
        self.expect(";")
        step = None if self.at(")") else self.simple_stmt()
        self.expect(")")
        return ["for", init, cond, step, self.statement()]

    def switch_stmt(self):
        self.expect("switch")
        subject = self.expr()
        self.expect("{")
        cases = []
        while not self.at("}") and not self.atkind("eof"):
            if self.accept("case"):
                value = self.expr()
                self.expect(":")
                cases.append([value, self.statements_until_case()])
            elif self.accept("default"):
                self.expect(":")
                cases.append([None, self.statements_until_case()])
            else:
                raise ParseError("%s:%d: switch 안에 %r" %
                                 (self.name, self.cur.line, self.cur.text))
        self.expect("}")
        return ["switch", subject, cases]

    def statements_until_case(self):
        out = []
        while not self.at("}") and not self.at("case") and not self.at("default") \
                and not self.atkind("eof"):
            s = self.statement()
            if s is not None:
                out.append(s)
        return out

    def command_stmt(self, eat_semi=True):
        """`message @sd, 3, "x";` 같은 괄호 없는 명령."""
        line = self.cur.line
        t = self.take()
        if t.kind not in ("name", "var"):
            raise ParseError("%s:%d: 문 자리에 %r" % (self.name, t.line, t.text))
        # 함수 호출을 문으로 쓴 경우: foo(1, 2);
        if t.kind == "name" and self.at("("):
            save = self.i
            self.take()
            args = self.arglist(")")
            self.expect(")")
            if self.at(";") or not eat_semi:
                if eat_semi:
                    self.accept(";")
                return ["call", t.text, args, line]
            self.i = save  # 괄호가 첫 인자였다 — 명령으로 다시 읽는다
        args = []
        if not self.at(";") and not self.atkind("eof") and not (not eat_semi and self.at(")")):
            args.append(self.expr())
            while self.accept(","):
                args.append(self.expr())
        if eat_semi:
            self.accept(";")
        return ["cmd", t.text, args, line]

    def arglist(self, stop):
        args = []
        if self.at(stop):
            return args
        args.append(self.expr())
        while self.accept(","):
            if self.at(stop):
                break  # gettime(0,0,) 처럼 쉼표를 흘린 곳이 원본에 있다
            args.append(self.expr())
        return args

    # --- 식 ---------------------------------------------------------
    def expr(self, level=0):
        if level >= len(BINARY):
            return self.unary()
        left = self.expr(level + 1)
        while self.cur.kind == "op" and self.cur.text in BINARY[level]:
            op = self.take().text
            right = self.expr(level + 1)
            left = ["bin", op, left, right]
        return left

    def unary(self):
        if self.cur.kind == "op" and self.cur.text in ("!", "-", "~", "+"):
            op = self.take().text
            return ["un", op, self.unary()]
        return self.primary()

    def primary(self):
        node = self.atom()
        # setarray @mapid[0], ... / @list[@i] 같은 첨자
        while self.at("["):
            self.take()
            index = self.expr()
            self.expect("]")
            node = ["index", node, index]
        return node

    def atom(self):
        t = self.take()
        if t.text == "(":
            e = self.expr()
            self.expect(")")
            return e
        if t.kind == "num":
            return ["num", float(t.text) if "." in t.text else int(t.text)]
        if t.kind == "str":
            return ["str", unescape(t.text)]
        if t.kind == "var":
            return ["var", t.text]
        if t.kind in ("name", "kw"):
            if self.at("("):
                self.take()
                args = self.arglist(")")
                self.expect(")")
                return ["call", t.text, args]
            return ["name", t.text]
        raise ParseError("%s:%d: 식 자리에 %r" % (self.name, t.line, t.text))


ESCAPES = {"n": "\n", "t": "\t", "r": "\r", '"': '"', "\\": "\\"}


def unescape(text):
    body = text[1:-1]
    out = []
    i = 0
    while i < len(body):
        c = body[i]
        if c == "\\" and i + 1 < len(body):
            out.append(ESCAPES.get(body[i + 1], body[i + 1]))
            i += 2
        else:
            out.append(c)
            i += 1
    return "".join(out)


def parse(src, name="<script>"):
    return Parser(src, name).parse_file()
