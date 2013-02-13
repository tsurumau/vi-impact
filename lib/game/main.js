ig.module( 
    'game.main' 
)
.requires(
    //'impact.debug.debug',
    'impact.game',
    'impact.font',
    'impact.sound',
	'game.entities.cursor',
	'game.levels.main',
    'game.impact',
	'plugins.box2d.game',
	'plugins.box2d.entity'
)
.defines(function () { "use strict";

ig.KEY.SEMICOLON = 59;
ig.KEY.SLASH = 191;
ig.KEY.OPENBRACKET = 219;
ig.KEY.BACKSLASH = 220;
ig.KEY.CLOSEBRACKET = 221;
ig.KEY.QUOTE = 222;

var Vi = {};

Vi.Engine = ig.Class.extend({
    text: new Array(),
    screenRow: 40,
    screenCol: 80,
    cursorOffset: 0,
    cursor: 0,
    cursorX: 0,
    cursorXorg: 0,
    cursorY: 0,
    mode: null,
    cursorSlippage: 0,
    isStickyEOL: false,
    insertionTimes: 1,
    insertionText: '',
    cmdline: null,
    set: {},

    init: function (row, col) {
        this.screenRow = row;
        this.screenCol = col;

        this.startNormal();
    },

    setRow: function (row) { this.screenRow = row; },
    setCol: function (col) { this.screenCol = col; },

    setText: function (txt) {
        txt = typeof txt === 'string' ? txt : '';
        this.text = new Array();
        this.setCursorPos({c:0, x:0, y:0});

        var mode_ = this.mode;
        this.startInsert();
        for (var i = 0; i < txt.length; ++i)
            this.insert(txt.charAt(i));
        this.mode = mode_;
    },

    setStickyEndOfLine: function (enabled) { this.isStickyEOL = enabled; },

    setImpact: function (enabled) {
        this.set.impact = enabled === false ? false : true;
    },

    startNormal: function () {
        if (1 < this.insertionTimes) {
            var count = this.insertionTimes;
            this.insertionTimes = 1;
            for (var i = 1; i < count; ++i)
                for (var j = 0; j < this.insertionText.length; ++j)
                    this.insert(this.insertionText[j]);
            this.insertionText = '';
        }

        this.mode = new Vi.NormalMode();
        this.cursorSlippage = 0;
        this.moveCursorToLeft();
    },

    startInsert: function (count) {
        this.mode = new Vi.InsertMode();
        this.insertionTimes = count || 1;
        this.cursorSlippage = 1;
    },

    startCmdline: function (count) {
        this.mode = new Vi.CmdlineMode();
        this.cmdline = ig.game.spawnEntity(Cmdline, 0, this.screenRow*ig.game.font.height);
    },

    processKey: function (key, ctrl) {
        this.mode.processKey(this, key, ctrl);
    },

    insert: function (ch) {
        //var start = this.cursor-1 < 0 ? 0 : this.cursor-1;
        this.text.splice(this.cursor++, 0, ch);
        if (ch == "\n") {
            this.cursorX = 0;
            this.cursorY++;
        } else {
            this.cursorX++;
        }

        if (this.screenRow <= this.cursorY) {
            this.cursorY = this.screenRow - 1;
            this.cursorOffset = this.endOfLine(this.cursorOffset) + 1;
        }

        if (1 < this.insertionTimes)
            this.insertionText += ch;

        if (this.set.impact) {
            this.showRune();
        }
        return;

        // adjust diff of initial editting
        if (this.text.length == 1)
            this.cursor = 0;

        if (ch == "\n") {
            this.moveCursorDownward();
        } else {
            this.moveCursorToRight();
        }
    },

    getCursorPos: function () {
        return {c: this.cursor, x: this.cursorX, y: this.cursorY};
        //return {x: this.cursorX + this.cursorSlippage, y: this.cursorY, c: this.cursor + this.cursorSlippage};
    },

    setCursor: function (c) {
        this.cursor = c;
    },

    setCursorPos: function (pos) {
        this.cursor = pos.c;
        this.cursorX = this.cursorXorg = pos.x;
        this.cursorY = pos.y;
    },

    moveCursorDownward: function (n, fnb /* first non-blank */) {
        var lines = n = n || 1;
        var p = this.cursor;
        var haveNext = false;

        if (this.text[p] == "\n") {
            if (p == this.text.length-1)
                    //p < this.text.length-1 && this.text[p+1] == "\n")
                return;

            if (p+1 < this.text.length && this.text[p+1] != "\n")
                ++p;
            /*
            if (p+1 < this.text.length && this.text[p+1] == "\n")
                this.cursor = p - 1;
            else
                this.cursor = p;
            this.cursorX = 0;
            return;
            */
        }

        while (0 < lines && p < this.text.length) {
            if (this.text[p++] == "\n") {
                --lines;
                haveNext = true;
            }
        }
        lines = n - lines;

        if (!haveNext) {
            return;
        }

        if (this.cursorY < this.screenRow - lines)
            this.cursorY += lines;
        else
            this.cursorY = this.screenRow - 1;

        /*
        if (this.text[p] == "\n") {
            if (1 < p && this.text[p-1] == "\n")
                this.cursor = p - 1;
            else
                this.cursor = p;
            this.cursorX = 0;
            return;
        }
        */

        var x = this.cursorXorg;
        while (p < this.text.length) {
            if (this.text[p] == "\n") {
                if (this.cursorXorg < this.cursorX)
                    this.cursorXorg = this.cursorX;
                if (this.text[p-1] != "\n")
                    --p;
                break;
            }

            if (this.isStickyEOL) {
                // EOF
                if (p == this.text.length-1)
                    break;
            } else if (!x--) {
                break;
            }
            ++p;
        }

        this.cursor = p;
        this.cursorX = p - this.beginningOfLine();
        return;

        if (fnb) {
        } else {
            this.cursorX = (this.cursor - beginning) % this.screenCol;
        }
    },

    /*
       |f|o|o
     \n|b|a|r
     \n|
     \n|
     \n|
    */
    moveCursorUpward: function (n, fnb /* first non-blank */) {
        if (this.cursorY <= 0)
            return;

        var lines = n = n || 1;
        this.cursorY--;
        while (0 < this.cursor) {
            if (this.text[this.cursor--] == "\n") {
                if (this.text[this.cursor] == "\n") {// &&
                        //0 < this.cursor && this.text[this.cursor-1] == "\n") {
                    break;
                }
                var x = this.cursorXorg;
                //var p = this.text[this.cursor] == "\n" ? this.cursor : this.beginningOfLine(this.cursor-1);
                var p = this.beginningOfLine(this.cursor-1);
                var len = this.cursor - p;// - 1;
                if (this.cursorX < this.cursorXorg) {
                    if (this.cursorXorg < len) {
                        this.cursor = p + this.cursorXorg;
                        this.cursorX = this.cursorXorg;
                    //} else if (this.cursorX <= len) {
                        //this.cursor = p + this.cursorX;
                    } else {
                        this.cursor--;
                        this.cursorX = len - 1;
                    }
                } else {
                    if (this.cursorX < len) {
                        this.cursor = p + this.cursorX;
                    } else if (this.cursorXorg < len) {
                        this.cursor = p + this.cursorXorg;
                        this.cursorX = this.cursorXorg;
                    } else {
                        //this.cursorX = 0 < len ? len - 1 : 0;
                        //this.cursor = p + this.cursorX;
                        //this.cursor--;
                        this.cursorX = len;
                    }
                }
                break;
            }
        }
    },

    moveCursorToRight: function (chars) {
        chars = chars || 1;
        while (0 < chars-- && this.cursor < this.text.length-1) {
            if (this.text[this.cursor+1] == "\n")
                break;

            if (this.cursorX < this.screenCol-1) {
                this.cursorX++;
                this.cursor++;
            } else {
                this.cursorX = 0;
                this.moveCursorDownward();
            }
        }
        this.cursorXorg = this.cursorX;
    },

    moveCursorToLeft: function (chars) {
        chars = chars || 1;
        while (0 < chars-- && 0 < this.cursorX) {
            this.cursorX--;
            this.cursor--;
        }
        this.cursorXorg = this.cursorX;
    },

    moveCursorCol: function (count) {
        count = count || 1;
        --count;
        if (this.cursorX === count)
            return;

        if (this.cursorX < count) {
            var end = this.endOfLinePos();
            if (end.x < count) {
                this.setCursorPos(end);
            } else {
                this.cursor += count - this.cursorX;
                this.cursorX = count;
            }

        } else {
            this.cursor -= this.cursorX - count;
            this.cursorX = count;
        }
    },

    moveCursorWordEndForward: function (count) {
    },

    moveCursorWORDEndForward: function (count) {
    },

    moveCursorWordBackward: function (count) {
    },

    moveCursorWORDBackward: function (count) {
    },

    moveCursorTopOfWin: function (count) {
        count = count || 1;
        --count;
        if (this.cursorY < count) {
            while (this.cursorY != count)
                this.moveCursorDownward();

        } else if (this.cursorY > count) {
            while (this.cursorY != count)
                this.moveCursorUpward();
        }
        this.setCursorPos(this.firstNonBlankPos());
    },

    moveCursorBottomOfWin: function (count) {
    },

    moveCursorMiddleOfWin: function (count) {
    },

    beginningOfLinePos: function (c) {
        return {c: this.beginningOfLine(c), x: 0, y: this.cursorY};
    },

    beginningOfLine: function (c) {
        var beginning = c  === undefined ? this.cursor : c;
        if (this.text[beginning] == "\n") {
            if (beginning+1 < this.text.length && this.text[beginning+1] != "\n")
                return beginning + 1;
            else
                return beginning;
        }

        while (0 < beginning) {
            if (this.text[beginning] == "\n") {
                ++beginning;
                break;
            }
            --beginning;
        }
        return beginning;
    },

    firstNonBlank: function (c) {
        var pos = this.firstNonBlankPos(c);
        return pos.c;
    },

    firstNonBlankPos: function (c) {
        var pos = this.beginningOfLinePos(c);
        while (this.text[pos.c].match(/[ \t]/)) {
            pos.x++;
            pos.c++;
        }
        return pos;
    },

    endOfLinePos: function (c) {
        var pos = {c: this.endOfLine(c), x: 0, y: this.cursorY};
        pos.x = pos.c - this.beginningOfLine(pos.c);
        return pos;
    },

    endOfLine: function (c) {
        var end = c === undefined ? this.cursor : c;
        if (this.text[end] == "\n") {
            if (end == this.text.length-1 ||
                    end < this.text.length-1 && this.text[end+1] == "\n")
                return end;

            if (end < this.text.length-1 && this.text[end+1] != "\n")
                ++end;
        }

        while (end < this.text.length) {
            if (this.text[end] == "\n") {
                if (0 < end)
                    --end;
                break;
            }
            ++end;
        }

        return end < this.text.length ? end : this.text.length - 1;
    },

    findToRightPos: function (ch, cnt) {
        cnt = cnt || 1;
        var pos = this.getCursorPos();
        var end = this.endOfLine();
        var p = this.cursor;
        while (++p <= end) {
            if (this.text[p] === ch && --cnt == 0) {
                pos.x = p - this.cursor;
                pos.c = p;
                break;
            }
        }

        return pos;
    },

    findToLeftPos: function (ch, cnt) {
        cnt = cnt || 1;
        var pos = this.getCursorPos();
        var p = this.cursor;
        while (0 <= --p) {
            if (this.text[p] === ch && --cnt == 0) {
                pos.x = this.cursorX - (this.cursor - p);
                pos.c = p;
                break;
            }
        }

        return pos;
    },

    tillToRightPos: function (ch, cnt) {
        var pos = this.findToRightPos(ch, cnt);
        if (this.cursor < pos.c) {
            pos.c--;
            pos.x--;
        }
        return pos;
    },

    tillToLeftPos: function (ch, cnt) {
        var pos = this.findToLeftPos(ch, cnt);
        if (this.cursor > pos.c) {
            pos.c++;
            pos.x++;
        }
        return pos;
    },

    deleteUnderCursor: function (chars) {
        chars = chars || 1;
        var begin = this.beginningOfLine();
        while (0 < chars) {
            if (begin == this.cursor && this.text[this.cursor] == "\n")
                break;

            if (this.text[this.cursor+1] == "\n" || this.text.length == this.cursor+1) {
                this.text.splice(this.cursor, 1);
                this.moveCursorToLeft();
            } else {
                this.text.splice(this.cursor, 1);
            }

            if (this.set.impact) {
                var charWidth = ig.game.font.widthForString('a');
                var e = ig.game.spawnEntity(EntityExplosion, this.cursorX*charWidth, this.cursorY*ig.game.font.height);
                e.zIndex = 10;
                ig.game.sortEntitiesDeferred();
            }

            --chars;
        }
    },

    deleteBeforeCursor: function (chars) {
    },

    deleteLine: function (count) {
        var begin = this.beginningOfLine();
        this.moveCursorDownward(count);
        var end = this.endOfLine();
        if (end != this.text.length-1 && this.text[end] != "\n") {
            ++end;
        } else if (0 < begin && this.text[begin] != "\n") {
            --begin;
            this.cursorY--;
        }
        this.text.splice(begin, end-begin+1);
        this.setCursorPos(this.beginningOfLinePos(begin));
    },

    yankLine: function (count) {
    },

    showRune: function () {
        if (this.set.impact) {
            ig.game.spawnEntity(EntityRune, this.cursorX*10, this.cursorY*ig.game.font.height);
        }
    },

    showShip: function () {
        ig.game.spawnEntity(EntityShip, 0, 0);
    },

    showCat: function () {
        ig.game.spawnEntity(CatFighter, this.cursorX*10, this.cursorY*ig.game.font.height);
    },

    getText: function () {
        return this.text.slice(this.cursorOffset).join('');
    }
});

(function () {
    var isAlnum = function (ch) {
        return ch.match(/^\w$/);
    };
    var isSpace = function (ch) {
        return ch.match(/^\s$/);
    };
    var fn = function (isWordFn) {
        return function (count) {
            count = count || 1;
            // At end of non-empty line
            if (this.text[this.cursor] != "\n" && this.text[this.cursor+1] == "\n") {
                this.setCursorPos(this.firstNonBlankPos(this.cursor+2));
                this.cursorY++;
                if (--count == 0)
                    return;
            }

            if (this.text[this.cursor] == "\n" &&
                    this.cursor+1 < this.text.length &&
                    this.text[this.cursor+1] == "\n") {
                // it should be at empty line but maybe not
                this.cursor++;
                this.cursorX = 0;
                this.cursorY++;
                if (--count == 0)
                    return;
            }

            var isWord = isWordFn(this.text[this.cursor]);
            while (this.cursor < this.text.length-1) {
                var s = this.text[this.cursor];

                if (s == "\n") {
                    --count;
                    if (this.text[this.cursor-1] == "\n") {
                        this.cursorX = 0;
                        this.cursorY++;
                    } else {
                        if  (count == 0) {
                            this.cursor--;
                            this.cursorX--;
                        } else {
                            // XXX
                            this.cursorX = -1;
                            this.cursorY++;
                        }
                    }
                    if (count == 0)
                        break;
                    isWord = false;

                } else if (isSpace(s)) {
                    this.cursor++;
                    this.cursorX++;
                    while (isSpace(this.text[this.cursor])) {
                        this.cursor++;
                        this.cursorX++;
                    }
                    if (--count == 0)
                        break;

                } else if (isWordFn(s)) {
                    if (isWord) {
                    } else {
                        if (--count == 0)
                            break;
                    }
                    isWord = true;

                } else {
                    if (isWord) {
                        if (--count == 0)
                            break;
                    } else {
                    }
                    isWord = false;
                }

                this.cursor++;
                this.cursorX++;
            }
        };
    };

    var isWORD = function (ch) {
        return ch.match(/^\S$/);
    };
    Vi.Engine.inject({
        moveCursorWordForward: fn(isAlnum),
        moveCursorWORDForward: fn(isWORD)
    });

})();

Vi.NormalMode = ig.Class.extend({
    staticInstantiate: function () { return Vi.NormalMode.instance; },

    init: function () {
        Vi.NormalMode.instance = this;
    },

    count: 0,
    command: null,
    state: null,

    processCount: function (vi, key, ctrl) {
        if (key.match(/^\d$/)) {
            this.count = parseInt(this.count + key);
            return true;
        }

        if (this.state == Vi.NormalMode.STATE.OPERATOR_PENDING_COUNT)
            this.state = Vi.NormalMode.STATE.OPERATOR_PENDING;
        else
            this.state = Vi.NormalMode.STATE.COMMAND;

        return false;
    },

    processCommandWithArg: function (vi, key) {
        switch (this.command) {
        case 'f':
            vi.setCursorPos(vi.findToRightPos(key, this.count));
            break;
        case 'F':
            vi.setCursorPos(vi.findToLeftPos(key, this.count));
            break;
        case 't':
            vi.setCursorPos(vi.tillToRightPos(key, this.count));
            break;
        case 'T':
            vi.setCursorPos(vi.tillToLeftPos(key, this.count));
            break;
        }

        this.count = '';
        this.state = Vi.NormalMode.STATE.COMMAND;
        return true;
    },

    processOperator: function (vi, key) {
        switch (key) {
        case 'c':
            break;
        case 'd':
            if (this.command == 'd')
                vi.deleteLine(this.count);
            break;
        case 'y':
            if (this.command == 'y')
                vi.yankLine(this.count);
            break;
        default:
            break;
        }

        this.count = '';
        this.state = Vi.NormalMode.STATE.COMMAND;
        return true;
    },

    //processCommand: function (vi, key, ctrl) {
    processKey: function (vi, key, ctrl) {
        switch (this.state) {
        case Vi.NormalMode.STATE.COUNT:
            if (this.processCount(vi, key))
                return;
            break;
        case Vi.NormalMode.STATE.OPERATOR_PENDING_COUNT:
            if (this.processCount(vi, key))
                return;
            break;
        case Vi.NormalMode.STATE.OPERATOR_PENDING:
            if (this.processOperator(vi, key))
                return;
            break;
        case Vi.NormalMode.STATE.COMMAND_ARG:
            if (this.processCommandWithArg(vi, key))
                return;
            break;
        case Vi.NormalMode.STATE.COMMAND:
        default:
        }

        switch (key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            this.count = parseInt(this.count + key);
            if (this.state == Vi.NormalMode.STATE.OPERATOR_PENDING)
                this.state = Vi.NormalMode.STATE.OPERATOR_PENDING_COUNT;
            else
                this.state = Vi.NormalMode.STATE.COUNT;
            break;
        case '0':
            if (this.state == Vi.NormalMode.STATE.COUNT)
                this.count = parseInt(this.count + key);
            else
                vi.setCursorPos(vi.beginningOfLinePos());
            break;
        case '^':
            vi.setCursorPos(vi.firstNonBlankPos());
            this.count = '';
            this.state = Vi.NormalMode.STATE.COMMAND;
            break;
        case '$':
            vi.setCursorPos(vi.endOfLinePos());
            vi.setStickyEndOfLine(true);
            break;
        case '-':
            vi.moveCursorUpward();
            vi.setCursorPos(vi.firstNonBlankPos());
            break;
        case "_":
        case "+":
        case "\n":
            vi.moveCursorDownward();
            vi.setCursorPos(vi.firstNonBlankPos());
            break;
        case 'i':
            vi.startInsert(this.count);
            break;
        case 'a':
            var pos = vi.getCursorPos();
            pos.x++; pos.c++;
            vi.setCursorPos(pos);
            vi.startInsert(this.count);
            break;
        case 'I':
            vi.setCursorPos(vi.firstNonBlankPos());
            vi.startInsert(this.count);
            break;
        case 'A':
            var pos = vi.endOfLinePos();
            pos.x++; pos.c++;
            vi.setCursorPos(pos);
            vi.startInsert(this.count);
            break;
        case 'O':
            vi.setCursorPos(vi.beginningOfLinePos());
            vi.insert("\n");
            vi.moveCursorUpward();
            vi.startInsert(this.count);
            break;
        case 'o':
            vi.setCursorPos(vi.endOfLinePos());
            var pos = vi.endOfLinePos();
            pos.x++; pos.c++;
            vi.setCursorPos(pos);
            vi.startInsert(this.count);
            vi.insert("\n");
            break;
        case 's':
            break;
        case 'S':
            break;

        case 'j':
            vi.moveCursorDownward(this.count);
            break;
        case 'k':
            vi.moveCursorUpward(this.count);
            break;
        case 'h':
            vi.moveCursorToLeft(this.count);
            break;
        case 'l':
            vi.moveCursorToRight(this.count);
            break;
        case ' ':
            vi.moveCursorToRight(this.count);
            break;
        case '|':
            vi.moveCursorCol(this.count);
            break;

        case 'M':
            vi.moveCursorMiddleOfWin();
            break;
        case 'H':
            vi.moveCursorTopOfWin(this.count);
            break;
        case 'L':
            vi.moveCursorBottomOfWin(this.count);
            break;

        case 'f':
        case 'F':
        case 't':
        case 'T':
            this.command = key;
            this.state = Vi.NormalMode.STATE.COMMAND_ARG;
            break;

        case 'w':
            vi.moveCursorWordForward(this.count);
            break;
        case 'W':
            vi.moveCursorWORDForward(this.count);
            break;
        case 'e':
            vi.moveCursorWordEndForward(this.count);
            break;
        case 'E':
            vi.moveCursorWORDEndForward(this.count);
            break;
        case 'b':
            vi.moveCursorWordBackward(this.count);
            break;
        case 'B':
            vi.moveCursorWORDBackward(this.count);
            break;
        case ';':
            break;
        case ',':
            break;
        case '{':
            break;
        case '}':
            break;
        case '(':
            break;
        case ')':
            break;
        case '[':
            break;
        case ']':
            break;

        case 'x':
            vi.deleteUnderCursor(this.count);
            break;
        case 'X':
            vi.deleteBeforeCursor(this.count);
            break;
        case 'p':
            break;
        case 'P':
            break;
        case 'J':
            break;
        case '>':
            break;
        case '<':
            break;
        case '.':
            break;

        case 'c':
            break;
        case 'C':
            break;
        case 'd':
            this.command = key;
            this.state = Vi.NormalMode.STATE.OPERATOR_PENDING;
            break;
        case 'D':
            break;
        case 'y':
            break;
        case 'Y':
            break;

        case '/':
            break;
        case '?':
            break;
        case 'n':
            break;
        case 'N':
            break;

        case ':':
            vi.startCmdline(this.count);
            break;

        }

        if ("$jk".indexOf(key) == -1)
            vi.setStickyEndOfLine(false);

        if (this.state != Vi.NormalMode.STATE.COUNT &&
                this.state != Vi.NormalMode.STATE.COMMAND_ARG &&
                this.state != Vi.NormalMode.STATE.OPERATOR_PENDING_COUNT)
            this.count = '';
    }

});
Vi.NormalMode.instance = null;
Vi.NormalMode.STATE = {
    COMMAND: 1,
    COMMAND_ARG: 2,
    COUNT: 3,
    FIND_CHAR: 4,
    OPERATOR_PENDING: 5,
};

Vi.VisualMode = ig.Class.extend({});

Vi.InsertMode = ig.Class.extend({
    staticInstantiate: function () { return Vi.InsertMode.instance; },

    init: function () {
        Vi.InsertMode.instance = this;
    },

    processKey: function (vi, key, ctrl) {
        if (key == "\x1B" || (key == "[" && ctrl)) {
            vi.startNormal();
            return;
        }
        vi.insert(key);
    }
});
Vi.InsertMode.instance = null;

Vi.CmdlineMode = ig.Class.extend({
    staticInstantiate: function () { return Vi.CmdlineMode.instance; },

    init: function () {
        Vi.CmdlineMode.instance = this;
    },

    processKey: function (vi, key, ctrl) {
        if (key == "\x1B" || (key == "c" && ctrl)) {
            vi.cmdline.kill();
            vi.startNormal();
            return;

        } else if (key == "\n" || (key == "m" && ctrl)) {
            vi.cmdline.exec();
            vi.startNormal();
            return;
        }
        vi.cmdline.insert(key);
    }
});
Vi.CmdlineMode.instance = null;

Vi.ExMode = ig.Class.extend({});


var Editor = ig.Entity.extend({
    init: function (x, y, settings) {
         this.parent(x, y, settings);
    },

	update: function () {
        this.parent();
    }
});

var Cmdline = ig.Entity.extend({
    command: null,
    init: function (x, y, settings) {
         this.parent(x, y, settings);
         this.command = '';
         /*
         this.vel.y = 200;
         this.maxVel.y = 10000;
         this.accel.y = 400;
         */
    },

	update: function () {
        this.parent();
    },

    draw: function () {
        this.parent();
        ig.game.font.draw(":"+this.command, this.pos.x, this.pos.y, ig.Font.ALIGN.LEFT);
    },

    exec: function () {
        if (this.command.match(/\s*set\s+(\w+)/)) {
            if (RegExp.$1 == 'impact') {
                ig.game.vi.setImpact();
                ig.game.sounds.impact.play();

            } else if (RegExp.$1 == 'cat') {
                ig.game.vi.setImpact();
                ig.game.vi.showCat();

            } else if (RegExp.$1 == 'ships') {
                ig.game.vi.setImpact();
                ig.game.vi.showShip();
            }
        }
        this.kill();
    },

    insert: function (c) {
        this.command += c;
    }
});

var KeyDriver = ig.Class.extend({
    init: function () {
        for (var key in ig.KEY) {
            var code = ig.KEY[key];
            ig.input.bind(code, code);
        }
        // XXX
        ig.input.bind(186, ig.KEY.SEMICOLON);
        ig.input.unbind(ig.KEY.ALT);
        ig.input.unbind(ig.KEY.R);
    },

	update: function () {
        for (var key in ig.KEY) {
            var code = ig.KEY[key];
            //if (!ig.input.state(code))
            if (!ig.input.pressed(code))
                continue;

            //if (this.prevKeyCode == code && this.timer.delta() < 0.25)
            //if (this.timer.delta() < 0.1)
                //return;
            //this.prevKeyCode = code;
            //this.timer.reset();
            //ig.input.clearPressed();

            var shift = ig.input.state(ig.KEY.SHIFT);
            var ch = this.codeToChar(code, shift);
            if (ch) {
                ig.game.vi.processKey(ch, ig.input.state(ig.KEY.CTRL));
                break;
            }
        }
    },

    codeToChar: function (code, shift) {
        var ch;
        switch (code) {
            case ig.KEY.ENTER:
                ch = "\n";
                break;
            case ig.KEY.ESC:
                ch = "\x1B";
                break;
            case ig.KEY.DELETE:
                ch = "\x7F";
                break;
            case ig.KEY.SPACE:
                ch = ' ';
                break;
            default:
                if (ig.KEY.A <= code && code <= ig.KEY.Z)
                    ch = String.fromCharCode(code + (shift ? 0 : 32));
                break;
        }
        return ch;
    }

});

var KeyDriverJp = KeyDriver.extend({
});

var KeyDriverEn = KeyDriver.extend({
    codeToChar: function (code, shift) {
        var ch;
        switch (code) {
            case ig.KEY._0:
                ch = shift ? ')' : '0';
                break;
            case ig.KEY._1:
                ch = shift ? '!' : '1';
                break;
            case ig.KEY._2:
                ch = shift ? '@' : '2';
                break;
            case ig.KEY._3:
                ch = shift ? '#' : '3';
                break;
            case ig.KEY._4:
                code = 36;
                ch = shift ? '$' : '4';
                break;
            case ig.KEY._5:
                ch = shift ? '%' : '5';
                break;
            case ig.KEY._6:
                ch = shift ? '^' : '6';
                break;
            case ig.KEY._7:
                ch = shift ? '&' : '7';
                break;
            case ig.KEY._8:
                ch = shift ? '*' : '8';
                break;
            case ig.KEY._9:
                ch = shift ? '(' : '9';
                break;
            case ig.KEY.PLUS:
                ch = shift ? '+' : '=';
                break;
            case ig.KEY.COMMA:
                ch = shift ? '<' : ',';
                break;
            case ig.KEY.MINUS:
                ch = shift ? '_' : '-';
                break;
            case ig.KEY.PERIOD:
                ch = shift ? '>' : '.';
                break;
            case ig.KEY.SEMICOLON:
                ch = shift ? ':' : ';';
                break;
            case ig.KEY.SLASH:
                ch = shift ? '?' : '/';
                break;
            case ig.KEY.BACKSLASH:
                ch = shift ? '|' : '\'';
                break;
            case ig.KEY.OPENBRACKET:
                ch = shift ? '{' : '[';
                break;
            case ig.KEY.CLOSEBRACKET:
                ch = shift ? '}' : ']';
                break;
            case ig.KEY.QUOTE:
                ch = shift ? '"' : "'";
                break;
                //ch = shift ? '~' : '`';
            default:
                break;
        }
        if (!ch)
            ch = this.parent(code, shift);
        return ch;
    }
});

var MyGame = ig.Box2DGame.extend({
//var MyGame = ig.Game.extend({
	//gravity: 100, // All entities are affected by this
    clearColor: '#002b36',
    //clearColor: '#fdf6e3',
    //timer: new ig.Timer(),

    font: new ig.Font('media/inconsolata-base0-16.font.png'),

    keyboard: null,
    vi: new Vi.Engine(),
    charWidth: 0,
    sounds: {},

    init: function () {
        this.keyboard = new KeyDriverEn();

        this.charWidth = this.font.widthForString('a');
        this.vi.setRow(parseInt(ig.system.height/this.font.height)-1);
        this.vi.setCol(parseInt(ig.system.width/this.charWidth));

        //this.vi.setText(decodeURIComponent(location.hash).substring(1));
        var q = location.search.substring(1);
        if (0 < q.length) {
            this.vi.setText(decodeURIComponent(q));
        }

        this.sounds.impact = new ig.Sound('media/sounds/Accept.mp3');
		this.loadLevel(LevelMain);

        ig.game.spawnEntity(EntityCursor, 0, 0);
    },

	loadLevel: function (data) {
        this.parent( data );
        for( var i = 0; i < this.backgroundMaps.length; i++ ) {
            this.backgroundMaps[i].preRender = true;
        }
    },

    update: function () {
        this.parent();

        this.keyboard.update();
    },

    draw: function () {
        this.parent();

        // Draw cursor
        var pos = this.vi.getCursorPos();
        /*
        ig.system.context.fillStyle="#073642";
        var charWidth = this.font.widthForString('a');
        var x = (pos.x < 0 ? 0 : pos.x) * charWidth;
        var y = pos.y * this.font.height;
        ig.system.context.fillRect(x, y, 10, this.font.height);
        ig.system.context.globalAlpha = 1;
        */

        // Draw text
        var text = this.vi.getText();
        this.font.draw(text, 0, 0);
        // debug
        //this.font.draw(text.substring(0, pos.c).replace(/./g,"_"), 0, 0);

        // Draw tilde
        var n = 0;
        var pos = text.indexOf("\n", 0);
        while (pos != -1) {
            pos = text.indexOf("\n", pos+1)
            ++n;
        }
        while (++n < this.vi.screenRow) {
            this.font.draw('~', 0, n * this.font.height);
        }

        if (text == '') {
            var x = ig.system.width/2;
            var y = ig.system.height/2;
            this.font.draw("VIM - Vi IMpact!\n\nversion 1.0\n\n", x, y, ig.Font.ALIGN.CENTER);
        }
    }
});

ig.main('#canvas', MyGame, 60, 480, 320, 1);

});

/*                          
 * ex: set ts=4 sts=0 sw=4 et:
 */
