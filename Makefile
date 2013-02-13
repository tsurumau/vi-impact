
.PHONY: dist

game.min.js: lib/game/main.js
	php tools/bake.php lib/impact/impact.js lib/game/main.js $@

dist: game.min.js

