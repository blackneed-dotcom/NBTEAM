# -*- coding: utf-8 -*-
"""바람 스크립트 AST -> mlua 소스.

원본 문법은 C 를 닮았지만 값 규칙이 루아와 다르다:
  * 0 은 거짓이다.
  * 비교식은 1/0 을 돌려준다.
  * / 는 정수 나눗셈이다.
  * + 는 한쪽이 글자면 이어붙이기다.
그래서 식은 전부 런타임 도우미(R.*)를 거치게 뽑는다. 값 규칙이 한 군데
모여 있으면 나중에 틀린 게 나와도 거기만 고치면 된다.
"""
import bparse


class Unsupported(Exception):
    pass


BIN_HELPER = {
    "+": "R.add", "-": "R.sub", "*": "R.mul", "/": "R.div", "%": "R.mod",
    "==": "R.eq", "!=": "R.ne", "<": "R.lt", ">": "R.gt",
    "<=": "R.le", ">=": "R.ge",
    "&&": "R.land", "||": "R.lor",
    "&": "R.band", "|": "R.bor", "^": "R.bxor",
    "<<": "R.shl", ">>": "R.shr",
}

UN_HELPER = {"!": "R.lnot", "-": "R.neg", "+": "R.pos", "~": "R.bnot"}


def flagname(label):
    safe = "".join(c if c.isalnum() or c == "_" else "_" for c in label)
    return "jump_" + safe

# @  임시(캐릭터 1회 실행 동안). .  .@ 도 같은 칸에 둔다.
# $  $@ 서버 전역.  #  계정.
SCOPE = {"@": "V", ".": "V", "$": "G", "#": "A"}


def luastr(s):
    out = s.replace("\\", "\\\\").replace('"', '\\"')
    out = out.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
    return '"' + out + '"'


class Emitter:
    def __init__(self, blocks, indent="        "):
        self.blocks = blocks          # 이름 -> body
        self.base = indent
        self.out = []
        self.used_cmds = set()
        self.used_funcs = set()
        self.called = set()
        self.goto_ok = []
        self.flags = set()

    # --- 식 ---------------------------------------------------------
    def expr(self, e):
        kind = e[0]
        if kind == "num":
            return repr(e[1])
        if kind == "str":
            return luastr(e[1])
        if kind == "name":
            return "R.const(%s)" % luastr(e[1])
        if kind == "var":
            return self.var_read(e[1])
        if kind == "index":
            return "R.aget(%s, %s)" % (self.slot(e[1]), self.expr(e[2]))
        if kind == "bin":
            # && || 는 루아 and/or 로 바로 펴야 원본처럼 뒷항을 건너뛴다.
            if e[1] == "&&":
                return "R.n(R.t(%s) and R.t(%s))" % (self.expr(e[2]), self.expr(e[3]))
            if e[1] == "||":
                return "R.n(R.t(%s) or R.t(%s))" % (self.expr(e[2]), self.expr(e[3]))
            return "%s(%s, %s)" % (BIN_HELPER[e[1]], self.expr(e[2]), self.expr(e[3]))
        if kind == "un":
            if e[1] == "!":
                return "R.n(not R.t(%s))" % self.expr(e[2])
            return "%s(%s)" % (UN_HELPER[e[1]], self.expr(e[2]))
        if kind == "call":
            name = e[1]
            args = e[2]
            if name == "getarg":
                return "R.getarg(C, %s)" % self.expr(args[0])
            if name == "callfunc":
                self.called.add(args[0][1] if args and args[0][0] == "str" else None)
                return self.callfunc_expr(args)
            self.used_funcs.add(name)
            inner = ", ".join(["C"] + [self.expr(a) for a in args])
            return 'B[%s](%s)' % (luastr(name), inner)
        raise Unsupported("식 %r" % (e,))

    def var_name(self, text):
        if text.startswith("$@") or text.startswith(".@"):
            return SCOPE[text[0]], text
        return SCOPE[text[0]], text

    def var_read(self, text):
        scope, key = self.var_name(text)
        return "R.get(%s, %s)" % (scope, luastr(key))

    def slot(self, target):
        """배열 첨자의 밑동. @x[0] 의 @x 를 표 하나로 만들어 준다."""
        if target[0] != "var":
            raise Unsupported("첨자 밑동 %r" % (target,))
        scope, key = self.var_name(target[1])
        return "R.arr(%s, %s)" % (scope, luastr(key))

    def callfunc_expr(self, args):
        name = args[0]
        rest = ", ".join(self.expr(a) for a in args[1:])
        return "R.callfunc(C, %s, {%s})" % (self.expr(name), rest)

    # --- 문 ---------------------------------------------------------
    def stmts(self, body, ind):
        for s in body:
            self.stmt(s, ind)

    def line(self, ind, text):
        self.out.append(ind + text)

    def stmt(self, s, ind):
        kind = s[0]
        if kind == "block":
            self.line(ind, "do")
            self.stmts(s[1], ind + "    ")
            self.line(ind, "end")
            return
        if kind == "set":
            target, value = s[1], s[2]
            if target[0] == "var":
                scope, key = self.var_name(target[1])
                self.line(ind, "R.set(%s, %s, %s)" % (scope, luastr(key), self.expr(value)))
            elif target[0] == "index":
                self.line(ind, "R.aset(%s, %s, %s)" %
                          (self.slot(target[1]), self.expr(target[2]), self.expr(value)))
            else:
                raise Unsupported("set 대상 %r" % (target,))
            return
        if kind == "if":
            self.line(ind, "if R.t(%s) then" % self.expr(s[1]))
            self.body_of(s[2], ind + "    ")
            node = s[3]
            while node is not None and node[0] == "if":
                self.line(ind, "elseif R.t(%s) then" % self.expr(node[1]))
                self.body_of(node[2], ind + "    ")
                node = node[3]
            if node is not None:
                self.line(ind, "else")
                self.body_of(node, ind + "    ")
            self.line(ind, "end")
            return
        if kind == "while":
            self.line(ind, "while R.t(%s) do" % self.expr(s[1]))
            self.body_of(s[2], ind + "    ")
            self.line(ind, "end")
            return
        if kind == "for":
            init, cond, step, body = s[1], s[2], s[3], s[4]
            self.line(ind, "do")
            if init is not None:
                self.stmt(init, ind + "    ")
            self.line(ind + "    ", "while %s do" %
                      ("R.t(%s)" % self.expr(cond) if cond is not None else "true"))
            self.body_of(body, ind + "        ")
            if step is not None:
                self.stmt(step, ind + "        ")
            self.line(ind + "    ", "end")
            self.line(ind, "end")
            return
        if kind == "switch":
            # 루아엔 switch 가 없다. 통과(fall-through)까지 살리려고
            # "맞는 곳부터 켠다" 식으로 편다.
            self.line(ind, "do")
            self.line(ind + "    ", "local sw = %s" % self.expr(s[1]))
            self.line(ind + "    ", "local on = false")
            self.line(ind + "    ", "repeat")
            for value, body in s[2]:
                if value is None:
                    self.line(ind + "        ", "on = true")
                else:
                    self.line(ind + "        ",
                              "if not on and R.t(R.eq(sw, %s)) then on = true end" % self.expr(value))
                self.line(ind + "        ", "if on then")
                self.body_of(["block", body], ind + "            ")
                self.line(ind + "        ", "end")
            self.line(ind + "    ", "until true")
            self.line(ind, "end")
            return
        if kind == "break":
            self.line(ind, "break")
            return
        if kind == "continue":
            raise Unsupported("continue")
        if kind == "end":
            self.line(ind, "R.stop()")
            return
        if kind == "return":
            self.line(ind, "do return end")
            return
        if kind == "goto":
            if s[1] in self.flags:
                # if 안으로 뛰는 뜀: 깃발을 세우고 고리에서 빠져나온다.
                self.line(ind, "%s = true" % flagname(s[1]))
                self.line(ind, "break  -- goto %s" % s[1])
                return
            if s[1] not in self.goto_ok:
                raise Unsupported("갈 곳 없는 goto %s" % s[1])
            self.line(ind, "break  -- goto %s" % s[1])
            return
        if kind == "label":
            return
        if kind == "flag":
            self.flags.add(s[1])
            self.line(ind, "local %s = false" % flagname(s[1]))
            return
        if kind == "if_jump":
            name, cond, head, tail = s[1], s[2], s[3], s[4]
            flag = flagname(name)
            self.line(ind, "if %s or R.t(%s) then" % (flag, self.expr(cond)))
            if head:
                self.line(ind + "    ", "if not %s then" % flag)
                self.stmts(head, ind + "        ")
                self.line(ind + "    ", "end")
            self.stmts(tail, ind + "    ")
            self.line(ind, "end")
            return
        if kind == "repeat_once":
            self.goto_ok.append(s[2])
            self.line(ind, "repeat")
            self.stmts(s[1], ind + "    ")
            self.line(ind, "until true")
            self.goto_ok.pop()
            return
        if kind == "cmd":
            name, args = s[1], s[2]
            if name == "callfunc":
                self.line(ind, self.callfunc_expr(args))
                if args and args[0][0] == "str":
                    self.called.add(args[0][1])
                return
            self.used_cmds.add(name)
            inner = ", ".join(["C"] + [self.expr(a) for a in args])
            self.line(ind, "B[%s](%s)" % (luastr(name), inner))
            return
        if kind == "call":
            name, args = s[1], s[2]
            self.used_funcs.add(name)
            inner = ", ".join(["C"] + [self.expr(a) for a in args])
            self.line(ind, "B[%s](%s)" % (luastr(name), inner))
            return
        raise Unsupported("문 %r" % (kind,))

    def body_of(self, s, ind):
        if s is None:
            return
        if s[0] == "block":
            self.stmts(s[1], ind)
        else:
            self.stmt(s, ind)


def each_stmt(node):
    """AST 안의 모든 문을 훑는다."""
    if not isinstance(node, list) or not node:
        return
    if node[0] in ("block", "if", "while", "for", "switch", "repeat_once"):
        pass
    yield node
    for x in node:
        if isinstance(x, list):
            for y in each_stmt(x):
                yield y


def count_goto(stmts, label):
    n = 0
    for s in stmts:
        for x in each_stmt(s):
            if x and x[0] == "goto" and x[1] == label:
                n += 1
    return n


def has_bare_break(stmts):
    """제 고리(loop) 없이 break 만 있는 머리는 repeat 로 감싸면 안 된다."""
    for s in stmts:
        if not isinstance(s, list) or not s:
            continue
        if s[0] == "break":
            return True
        if s[0] in ("while", "for"):
            continue  # 제 고리 안의 break 는 제 고리가 먹는다
        for x in s:
            if isinstance(x, list) and x and isinstance(x[0], str):
                if has_bare_break([x]):
                    return True
            elif isinstance(x, list):
                if has_bare_break(x):
                    return True
    return False


def block_body(node):
    """if 의 몸통이 블록이면 그 문 목록을 돌려준다."""
    if isinstance(node, list) and node and node[0] == "block":
        return node[1]
    return None


def jump_into_if(stmts):
    """뒤쪽 if 몸통 안으로 뛰어드는 goto 를 깃발로 편다.

    원본에 이런 꼴이 있다(FUNC_MAGICIANCHOM, FUNC_TARGETMAGICIANCHOM):

        for(...) { ... goto NEXT2; ... }
        if(@notarget != 4) { action ...; NEXT2: message ...; }

    goto 가 조건을 건너뛰고 if 안쪽으로 들어간다. 루아엔 그런 뜀이 없으니
    깃발 하나를 두고, if 조건에 "깃발이 서 있으면 무조건"을 얹고,
    라벨 앞 문들은 "깃발이 안 섰을 때만"으로 감싼다.
    """
    for index, s in enumerate(stmts):
        if not (isinstance(s, list) and s and s[0] == "if" and s[3] is None):
            continue
        body = block_body(s[2])
        if body is None:
            continue
        marks = [k for k, x in enumerate(body)
                 if isinstance(x, list) and x and x[0] == "label"]
        if not marks:
            continue
        k = marks[0]
        name = body[k][1]
        before = stmts[:index]
        if count_goto(before, name) == 0:
            continue
        # 뛰는 자리가 고리 안이어야 break 로 빠져나올 수 있다.
        for earlier in before:
            if count_goto([earlier], name) and not loop_wraps_goto(earlier, name):
                raise Unsupported("고리 밖에서 if 안으로 뛰는 goto %s" % name)
        head = body[:k]
        tail = body[k + 1:]
        if count_goto(tail, name) or count_goto(head, name):
            raise Unsupported("if 안으로 뛰는 goto %s 가 얽혀 있다" % name)
        rest = stmts[index + 1:]
        if count_goto(rest, name):
            raise Unsupported("뒤로 뛰는 goto %s" % name)
        return (name, before, s[1], head, tail, rest)
    return None


def loop_wraps_goto(node, label):
    """그 문 안에서 goto 가 고리(while/for) 안에 들어 있나."""
    if not isinstance(node, list) or not node:
        return False
    if node[0] in ("while", "for"):
        return count_goto([node], label) > 0
    for x in node:
        if isinstance(x, list):
            if loop_wraps_goto(x, label):
                return True
            for y in x:
                if isinstance(y, list) and loop_wraps_goto(y, label):
                    return True
    return False


def transform(stmts):
    """goto/label 을 repeat ... until true + break 로 바꾼다.

    원본에서 goto 는 거의 다 "여기까지 건너뛰고 마무리 줄로 가라"다.
    라벨 앞을 repeat 로 감싸면 goto 는 그냥 break 가 된다.
    """
    # 자식을 먼저 손보면 안쪽 transform 이 라벨을 먹어버려서 못 찾는다.
    # 그래서 "if 안으로 뛰는 뜀"은 원문 그대로일 때 먼저 본다.
    found = jump_into_if(stmts)
    if found is not None:
        name, before, cond, head, tail, rest = found
        node = ["if_jump", name, cond, transform(head), transform(tail)]
        return ([["flag", name]] + transform(before)
                + [node] + transform(rest))
    out = []
    for s in stmts:
        out.append(rewrite(s))
    labels = [i for i, s in enumerate(out) if isinstance(s, list) and s and s[0] == "label"]
    if not labels:
        return out
    i = labels[0]
    name = out[i][1]
    head, tail = out[:i], transform(out[i + 1:])
    if count_goto(tail, name):
        raise Unsupported("뒤로 뛰는 goto %s" % name)
    if has_bare_break(head):
        raise Unsupported("goto 머리 안에 맨 break 가 있다")
    return [["repeat_once", head, name]] + tail


def rewrite(s):
    if not isinstance(s, list) or not s:
        return s
    kind = s[0]
    if kind == "block":
        return ["block", transform(s[1])]
    if kind == "if":
        return ["if", s[1], rewrite(s[2]), rewrite(s[3]) if s[3] is not None else None]
    if kind == "while":
        return ["while", s[1], rewrite(s[2])]
    if kind == "for":
        return ["for", s[1], s[2], s[3], rewrite(s[4])]
    if kind == "switch":
        return ["switch", s[1], [[v, transform(b)] for v, b in s[2]]]
    return s


def emit_block(name, body, emitter, ind):
    body = transform(body)
    emitter.line(ind, "S[%s] = function(C)" % luastr(name))
    inner = ind + "    "
    emitter.line(inner, "local V, G, A = C.v, C.g, C.a")
    emitter.stmts(body, inner)
    emitter.line(ind, "end")
