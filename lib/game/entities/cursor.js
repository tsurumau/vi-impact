ig.module( 
    'game.entities.cursor' 
)
.requires(
	'impact.entity',
	'plugins.box2d.entity'
)
.defines(function () {

//EntityCursor = ig.Box2DEntity.extend({
EntityCursor = ig.Entity.extend({
    init: function (x, y, settings) {
         this.parent(x, y, settings);
         this.accel.x = 100;
         this.accel.y = 100;
         this.maxVel.x = 10000;
         this.maxVel.y = 10000;
         this.size.x = 10;
         this.size.y = ig.game.font.height;
    },

	update: function () {
        this.parent();

        var charWidth = ig.game.font.widthForString('a');
        var pos = ig.game.vi.getCursorPos();
        var x = (pos.x < 0 ? 0 : pos.x) * charWidth;
        var y = pos.y * ig.game.font.height;
        if (!ig.game.vi.set.impact) {
            this.pos.x = x;
            this.pos.y = y;
            return;
        }

        if (this.pos.x != x || this.pos.y != y) {
            if (this.vel.x == 0 && this.vel.y == 0) {
                if (this.pos.x - x < 0)
                    this.vel.x = 100;
                else if (this.pos.x - x > 0)
                    this.vel.x = -100;

                if (this.pos.y - y < 0)
                    this.vel.y = 100;
                else if (this.pos.y - y > 0)
                    this.vel.y = -100;

            } else {
                if (this.vel.x < 0 && this.pos.x - x < 0 ||
                        this.vel.x > 0 && this.pos.x - x > 0) {
                    this.vel.x = 0;
                    this.accel.x = 0;
                    this.pos.x = x;
                }
                if (this.vel.y < 0 && this.pos.y - y < 0 ||
                        this.vel.y > 0 && this.pos.y - y > 0) {
                    this.vel.y = 0;
                    this.accel.y = 0;
                    this.pos.y = y;
                }
            }

        } else {
            this.pos.x = x;
            this.pos.y = y;
        }
    },

    draw: function () {
        this.parent();

        //ig.system.context.fillStyle = "#073642";
        ig.system.context.fillStyle = "#93a1a1";
        //var charWidth = ig.game.font.widthForString('a');
        //var x = (this.pos.x < 0 ? 0 : this.pos.x) * charWidth;
        //var y = this.pos.y * ig.game.font.height;
        ig.system.context.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
        ig.system.context.globalAlpha = 1;
    }
});

});

/*                          
 * ex: set ts=4 sts=0 sw=4 et:
 */
