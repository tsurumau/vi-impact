
describe("Vi.Core", function () {
  var vi;

	beforeEach(function () {
      waitsFor(function () { return ig.game; });
      runs(function () { vi = ig.game.vi; });
	});

  /*
	after(function() {
	});
  */

  describe("#setText()", function () {
    it('should work for strings', function() {
      var test1 = function (t) {vi.setText(t); expect(vi.getText()).toEqual(t);}
      var test2 = function (a,b) {vi.setText(a); expect(vi.getText()).toEqual(b);}
      runs(function () {
        test1("");
        test1("foo");
        test1("foo\nbar\nbaz");
        test1("\n\n\n");
        test1((new Array(8192)).join('@'));
        test2(null, '');
        test2(undefined, '');
        test2(123, '');
      });
    });
  });

  describe("#setCursorPos()", function () {
    it('should work for strings', function() {
      var test1 = function (p) {vi.setCursorPos(p); expect(vi.getCursorPos()).toEqual(p);}
      runs(function () {
        vi.setText("foo\nbar\nbaz");
        test1({c:0, x:0, y:0});
        test1({c:1, x:1, y:0});
        test1({c:4, x:0, y:1});
      });
    });
  });

  describe("#beginningOfLinePos()", function () {
    var test1 = function (p1, p2) {
      vi.setCursorPos(p1);
      expect(vi.beginningOfLinePos()).toEqual(p2);
    };

    it('no empty line', function() {
      vi.setText("foo\nbar\nbaz");
      test1({c:0, x:0, y:0}, {c:0, x:0, y:0});
      test1({c:1, x:1, y:0}, {c:0, x:0, y:0});
      test1({c:2, x:2, y:0}, {c:0, x:0, y:0});
      test1({c:3, x:0, y:1}, {c:4, x:0, y:1});
      test1({c:4, x:0, y:1}, {c:4, x:0, y:1});
      test1({c:5, x:1, y:1}, {c:4, x:0, y:1});
      test1({c:6, x:2, y:1}, {c:4, x:0, y:1});
    });

    it('only empty line', function() {
      vi.setText("\n\n\n\n");
      test1({c:0, x:0, y:0}, {c:0, x:0, y:0});
      test1({c:1, x:0, y:1}, {c:1, x:0, y:1});
      test1({c:2, x:0, y:2}, {c:2, x:0, y:2});
      test1({c:3, x:0, y:3}, {c:3, x:0, y:3});
    });
  });

  describe("#endOfLinePos()", function () {
    var test1 = function (p1, p2) {
      vi.setCursorPos(p1);
      expect(vi.endOfLinePos()).toEqual(p2);
    };

    it('no empty line', function() {
      vi.setText("foo\nbar\nbaz");
      test1({c:0, x:0, y:0}, {c:2, x:2, y:0});
      test1({c:1, x:1, y:0}, {c:2, x:2, y:0});
      test1({c:2, x:2, y:0}, {c:2, x:2, y:0});
      test1({c:3, x:0, y:1}, {c:6, x:2, y:1});
      test1({c:4, x:0, y:1}, {c:6, x:2, y:1});
      test1({c:5, x:1, y:1}, {c:6, x:2, y:1});
      test1({c:6, x:2, y:1}, {c:6, x:2, y:1});
      test1({c:7, x:0, y:2}, {c:10, x:2, y:2});
    });

    it('only empty line', function() {
      vi.setText("\n\n\n\n");
      test1({c:0, x:0, y:0}, {c:0, x:0, y:0});
      test1({c:1, x:0, y:1}, {c:1, x:0, y:1});
      test1({c:2, x:0, y:2}, {c:2, x:0, y:2});
      test1({c:3, x:0, y:3}, {c:3, x:0, y:3});
    });
  });

  describe("#firstNonBlankPos()", function () {
    var expectPosToEqual = function (p1, p2) {
      vi.setCursorPos(p1);
      expect(vi.firstNonBlankPos()).toEqual(p2);
    };

    it('no empty line', function() {
      vi.setText("foo\nbar\nbaz");
      expectPosToEqual({c:0, x:0, y:0}, {c:0, x:0, y:0});
      expectPosToEqual({c:1, x:1, y:0}, {c:0, x:0, y:0});
      expectPosToEqual({c:2, x:2, y:0}, {c:0, x:0, y:0});
      expectPosToEqual({c:3, x:0, y:1}, {c:4, x:0, y:1});
      expectPosToEqual({c:4, x:0, y:1}, {c:4, x:0, y:1});
      expectPosToEqual({c:5, x:1, y:1}, {c:4, x:0, y:1});
      expectPosToEqual({c:6, x:2, y:1}, {c:4, x:0, y:1});
      expectPosToEqual({c:7, x:0, y:2}, {c:8, x:0, y:2});
    });

    it('only empty line', function() {
      vi.setText("\n\n\n\n");
      expectPosToEqual({c:0, x:0, y:0}, {c:0, x:0, y:0});
      expectPosToEqual({c:1, x:0, y:1}, {c:1, x:0, y:1});
      expectPosToEqual({c:2, x:0, y:2}, {c:2, x:0, y:2});
      expectPosToEqual({c:3, x:0, y:3}, {c:3, x:0, y:3});
    });

    it('one space', function() {
      vi.setText(" foo\n bar\nbaz");
      expectPosToEqual({c:0, x:0, y:0}, {c:1, x:1, y:0});
      expectPosToEqual({c:3, x:3, y:0}, {c:1, x:1, y:0});
      expectPosToEqual({c:5, x:1, y:1}, {c:6, x:1, y:1});
      expectPosToEqual({c:8, x:3, y:1}, {c:6, x:1, y:1});
    });

    it('more spaces', function() {
      vi.setText("    foo\n    bar\nbaz");
      expectPosToEqual({c:0, x:0, y:0}, {c:4, x:4, y:0});
      expectPosToEqual({c:6, x:6, y:0}, {c:4, x:4, y:0});
      expectPosToEqual({c:10, x:0, y:1}, {c:12, x:4, y:1});
      expectPosToEqual({c:14, x:4, y:1}, {c:12, x:4, y:1});
    });

  });

  describe("#moveCursorDownward()", function () {
    var expectPosToEqual = function (p1, p2) {
      vi.setCursorPos(p1);
      vi.moveCursorDownward();
      expect(vi.getCursorPos()).toEqual(p2);
    };

    it('no empty line', function() {
      vi.setText("foo\nbar\nbaz");
      expectPosToEqual({c:0, x:0, y:0}, {c:4, x:0, y:1});
      expectPosToEqual({c:1, x:1, y:0}, {c:5, x:1, y:1});
      expectPosToEqual({c:2, x:2, y:0}, {c:6, x:2, y:1});
      expectPosToEqual({c:3, x:0, y:1}, {c:8, x:0, y:2});
      expectPosToEqual({c:4, x:0, y:1}, {c:8, x:0, y:2});
      expectPosToEqual({c:5, x:1, y:1}, {c:9, x:1, y:2});
      expectPosToEqual({c:6, x:2, y:1}, {c:10, x:2, y:2});
      expectPosToEqual({c:7, x:0, y:2}, {c:7, x:0, y:2});
    });

    it('only empty line', function() {
      vi.setText("\n\n\n\n");
      expectPosToEqual({c:0, x:0, y:0}, {c:1, x:0, y:1});
      expectPosToEqual({c:1, x:0, y:1}, {c:2, x:0, y:2});
      expectPosToEqual({c:2, x:0, y:2}, {c:3, x:0, y:3});
      expectPosToEqual({c:3, x:0, y:3}, {c:3, x:0, y:3});
    });

  });

  describe("#moveCursorUpward()", function () {
    var expectPosToEqual = function (p1, p2) {
      vi.setCursorPos(p1);
      vi.moveCursorUpward();
      expect(vi.getCursorPos()).toEqual(p2);
    };

    it('no empty line', function() {
      //          012 3456 789
      vi.setText("foo\nbar\nbaz");
      expectPosToEqual({c:0, x:0, y:0}, {c:0, x:0, y:0});
      expectPosToEqual({c:1, x:1, y:0}, {c:1, x:1, y:0});
      expectPosToEqual({c:2, x:2, y:0}, {c:2, x:2, y:0});
      expectPosToEqual({c:3, x:0, y:1}, {c:0, x:0, y:0});
      expectPosToEqual({c:4, x:0, y:1}, {c:0, x:0, y:0});
      expectPosToEqual({c:5, x:1, y:1}, {c:1, x:1, y:0});
      expectPosToEqual({c:6, x:2, y:1}, {c:2, x:2, y:0});
      expectPosToEqual({c:7, x:0, y:2}, {c:4, x:0, y:1});
      expectPosToEqual({c:8, x:0, y:2}, {c:4, x:0, y:1});
      expectPosToEqual({c:9, x:1, y:2}, {c:5, x:1, y:1});
      expectPosToEqual({c:10, x:2, y:2}, {c:6, x:2, y:1});
    });

    it('only empty line', function() {
      vi.setText("\n\n\n\n");
      expectPosToEqual({c:0, x:0, y:0}, {c:0, x:0, y:0});
      expectPosToEqual({c:1, x:0, y:1}, {c:0, x:0, y:0});
      expectPosToEqual({c:2, x:0, y:2}, {c:1, x:0, y:1});
      expectPosToEqual({c:3, x:0, y:3}, {c:2, x:0, y:2});
    });

  });

  describe("#moveCursorWordForward()", function () {
    var expectPosToEqual = function (p1, p2, cnt) {
      vi.setCursorPos(p1);
      vi.moveCursorWordForward(cnt);
      expect(vi.getCursorPos()).toEqual(p2);
    };

    it('foo bar baz', function() {
      vi.setText("foo bar baz");
      expectPosToEqual({c:0, x:0, y:0}, {c:4, x:4, y:0});
      expectPosToEqual({c:4, x:4, y:0}, {c:8, x:8, y:0});
      expectPosToEqual({c:8, x:8, y:0}, {c:10, x:10, y:0});
      expectPosToEqual({c:0, x:0, y:0}, {c:8, x:8, y:0}, 2);
      expectPosToEqual({c:0, x:0, y:0}, {c:10, x:10, y:0}, 3);
    });

    it('new line', function() {  
      vi.setText("foo\nbar\nbaz");
      expectPosToEqual({c:0, x:0, y:0}, {c:2, x:2, y:0});
      expectPosToEqual({c:2, x:2, y:0}, {c:4, x:0, y:1});
      expectPosToEqual({c:4, x:0, y:1}, {c:6, x:2, y:1});
      expectPosToEqual({c:6, x:2, y:1}, {c:8, x:0, y:2});
      expectPosToEqual({c:0, x:0, y:0}, {c:8, x:0, y:2}, 4);
      expectPosToEqual({c:0, x:0, y:0}, {c:10, x:2, y:2}, 5);
    });

    it('new line with space', function() {  
      vi.setText("foo\nbar \n  baz  \n");
    });

    it('only empty line', function() {
      vi.setText("\n\n\n\n");
      expectPosToEqual({c:0, x:0, y:0}, {c:1, x:0, y:1});
      expectPosToEqual({c:1, x:0, y:1}, {c:2, x:0, y:2});
      expectPosToEqual({c:2, x:0, y:2}, {c:3, x:0, y:3});
      expectPosToEqual({c:3, x:0, y:3}, {c:3, x:0, y:3});
    });

    it('symbol (end with symbol)', function() {
      vi.setText("!foo(bar)");
      expectPosToEqual({c:0, x:0, y:0}, {c:1, x:1, y:0});
      expectPosToEqual({c:1, x:1, y:0}, {c:4, x:4, y:0});
      expectPosToEqual({c:4, x:4, y:0}, {c:5, x:5, y:0});
      expectPosToEqual({c:5, x:5, y:0}, {c:8, x:8, y:0});
      expectPosToEqual({c:8, x:8, y:0}, {c:8, x:8, y:0});
    });

    it('symbol (end with word)', function() {
      vi.setText("!foo(bar)baz");
      expectPosToEqual({c:0, x:0, y:0}, {c:1, x:1, y:0});
      expectPosToEqual({c:1, x:1, y:0}, {c:4, x:4, y:0});
      expectPosToEqual({c:4, x:4, y:0}, {c:5, x:5, y:0});
      expectPosToEqual({c:5, x:5, y:0}, {c:8, x:8, y:0});
      expectPosToEqual({c:8, x:8, y:0}, {c:9, x:9, y:0});
      expectPosToEqual({c:9, x:9, y:0}, {c:11, x:11, y:0});
      expectPosToEqual({c:11, x:11, y:0}, {c:11, x:11, y:0});
    });

  });

  describe("#findToRightPos()", function () {
    var expectPosToEqual = function (p1, p2, ch, cnt) {
      vi.setCursorPos(p1);
      expect(vi.findToRightPos(ch, cnt)).toEqual(p2);
    };

    it('foo bar baz', function() {
      vi.setText("foo bar baz");
      expectPosToEqual({c:0, x:0, y:0}, {c:0, x:0, y:0}, 'f');
      expectPosToEqual({c:0, x:0, y:0}, {c:1, x:1, y:0}, 'o');
      expectPosToEqual({c:0, x:0, y:0}, {c:2, x:2, y:0}, 'o', 2);
      expectPosToEqual({c:0, x:0, y:0}, {c:3, x:3, y:0}, ' ');
      expectPosToEqual({c:0, x:0, y:0}, {c:7, x:7, y:0}, ' ', 2);
      expectPosToEqual({c:0, x:0, y:0}, {c:10, x:10, y:0}, 'z');
    });

    it('not found', function() {
      vi.setText("foo bar baz");
      expectPosToEqual({c:0, x:0, y:0}, {c:0, x:0, y:0}, 'c');
      expectPosToEqual({c:0, x:0, y:0}, {c:0, x:0, y:0}, 'o', 3);
      expectPosToEqual({c:1, x:1, y:0}, {c:1, x:1, y:0}, 'f');
      expectPosToEqual({c:10, x:10, y:0}, {c:10, x:10, y:0}, 'f');
    });
  });

  describe("#findToLeftPos()", function () {
    var expectPosToEqual = function (p1, p2, ch, cnt) {
      vi.setCursorPos(p1);
      expect(vi.findToLeftPos(ch, cnt)).toEqual(p2);
    };

    it('foo bar baz', function() {
      vi.setText("foo bar baz");
      expectPosToEqual({c:10, x:10, y:0}, {c:0, x:0, y:0}, 'f');
      expectPosToEqual({c:10, x:10, y:0}, {c:2, x:2, y:0}, 'o');
      expectPosToEqual({c:10, x:10, y:0}, {c:1, x:1, y:0}, 'o', 2);
      expectPosToEqual({c:10, x:10, y:0}, {c:7, x:7, y:0}, ' ');
      expectPosToEqual({c:10, x:10, y:0}, {c:3, x:3, y:0}, ' ', 2);
      expectPosToEqual({c:10, x:10, y:0}, {c:10, x:10, y:0}, 'z');
    });

    it('not found', function() {
      vi.setText("foo bar baz");
      expectPosToEqual({c:10, x:10, y:0}, {c:10, x:10, y:0}, 'c');
      expectPosToEqual({c:10, x:10, y:0}, {c:10, x:10, y:0}, 'o', 3);
      expectPosToEqual({c:10, x:10, y:0}, {c:10, x:10, y:0}, 'z');
      expectPosToEqual({c:0, x:0, y:0}, {c:0, x:0, y:0}, 'f');
    });
  });


});
