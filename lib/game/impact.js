ig.module( 
    'game.impact' 
)
.requires(
	'impact.entity',
	'plugins.box2d.entity'
)
.defines(function () {

EntityExplosion = ig.Entity.extend({
    animSheet: new ig.AnimationSheet('media/explosion.png', 24, 24),
    init: function (x, y, settings) {
         this.addAnim('exp', 0.1, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16]);
         this.parent(x, y, settings);
    },

    update: function () {
        this.parent();
        if (0 < this.anims.exp.loopCount)
            this.kill();
    }
});

EntityRune = ig.Entity.extend({
    files: ['media/teleport_rune.png', 'media/berzerk_rune.png', 'media/guard_rune.png'],
    animSheet: null,
    init: function (x, y, settings) {
        this.animSheet = new ig.AnimationSheet(this.files.random(), 64, 64);
        this.addAnim('main', 0.1, [0,1,2,3]);
        this.parent(x, y, settings);
    },

    times: 0,
    update: function () {
        this.parent();
        if (100 < this.times++)
            this.kill();
    }
});

EntityEffect = ig.Entity.extend({
//EntityEffect = ig.Box2DEntity.extend({
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.B, 
	collides: ig.Entity.COLLIDES.NEVER, // Collision is already handled by Box2D!
    maxVel: {x: 1000, y:1000},

    animSheet: new ig.AnimationSheet('media/energy_effect_base.png', 32, 32),
    init: function (x, y, settings) {
        this.addAnim('shot1', 0.2, [0,1,2,3,4,5,6]);
        this.addAnim('shot2', 0.2, [16,17,18,19,20,21,22]);
        this.parent(x, y, settings);

        this.accel.x = this.flip ? -500 : 500;

        var velocity = (settings.flip ? -100 : 100);
        this.vel.x = velocity;
        //this.body.ApplyImpulse( new b2.Vec2(velocity,0), this.body.GetPosition() );
    },

    update: function () {
        this.currentAnim.flip.x = this.flip;
        this.parent();
        if (0 < this.currentAnim.loopCount)
            this.kill();
    }
});

CatFighter = ig.Entity.extend({
//CatFighter = ig.Box2DEntity.extend({
    maxVel: {x: 12, y:100},
	accelGround: 10,
	accelAir: 500,
	jump: 200,
	health: 10,
	flip: false,

    animSheet: new ig.AnimationSheet('media/cat_ar_base.png', 64, 64),
    init: function (x, y, settings) {
        this.addAnim('idle', 0.5, [16,17,18,19,20,21,22,23]);
        this.addAnim('walk', 0.1, [48,49,50,51,52,53,54,55]);
        this.addAnim('walkShot', 0.1, [64,65,66,67,68,69,70,71]);
        this.addAnim('jump', 0.1, [80,81,82,83,84,85,86,87,88,89]);
        this.addAnim('jumpShot', 0.1, [96]);
        this.addAnim('spin', 0.1, [112]);
        this.addAnim('down', 0.1, [128,129,130,131,132,133,134,135,136]);
        this.parent(x, y, settings);
    },

	update: function () {
		var accel = this.standing ? this.accelGround : this.accelAir;
		if (ig.input.state(ig.KEY.H)) {
			this.accel.x = -accel;
			//this.body.ApplyForce( new b2.Vec2(-20,0), this.body.GetPosition() );
			this.flip = true;
		}
		else if (ig.input.state(ig.KEY.L)) {
			this.accel.x = accel;
			//this.body.ApplyForce( new b2.Vec2(20,0), this.body.GetPosition() );
			this.flip = false;
		}
		else {
			this.accel.x = 0;
			this.vel.x = 0;
		}

		// jump
		//if (this.standing && ig.input.pressed(ig.KEY.K)) {
		if (ig.input.pressed(ig.KEY.K)) {
			//this.vel.y = -this.jump;
			//this.body.ApplyForce( new b2.Vec2(0,-30), this.body.GetPosition() );
		}

		// down
		if (ig.input.state(ig.KEY.J)) {
            //this.currentAnim = this.anims.down;
		}

		// shoot
		if (ig.input.pressed(ig.KEY.V)) {
			ig.game.spawnEntity(EntityEffect, this.pos.x+(this.flip?-5:45), this.pos.y+25, {flip:this.flip} );
		}

		// set the current animation, based on the player's speed
		if (this.vel.y < 0) {
			this.currentAnim = this.anims.jump;

		} else if (this.vel.y > 0) {
			this.currentAnim = this.anims.fall;

		} else if (this.vel.x != 0) {
            if (ig.input.state(ig.KEY.G))
                this.currentAnim = this.anims.walkShot;
            else
                this.currentAnim = this.anims.walk;

		} else {
			this.currentAnim = this.anims.idle;
		}
		
		this.currentAnim.flip.x = this.flip;

        this.parent();
    },

    draw: function () {
        this.parent();
        ig.game.font
        ig.game.font.draw("Shot:V or G+H or G+L", 20, ig.system.height-40, ig.Font.ALIGN.LEFT);
    }
});

EntityShip = ig.Entity.extend({
    animSheet: null,
    init: function (x, y, settings) {
        this.animSheet = new ig.AnimationSheet('media/spaceships/'+[1,2,3,4,5,6,7,8,9,10,11,12,13].random()+'.png');
        this.addAnim('main', 1, [0]);

        x = [0,ig.system.height].random();
        y = Math.floor(Math.random()*ig.system.height+1);
        if (x > 0)
        settings.flip = true;
        console.log(x);
        console.log(y);
        this.parent(x, y, settings);
        this.vel.x = [20,40,80,100].random();
        if (this.flip) {
        this.vel.x = -this.vel.x;
        this.currentAnim.flip.x = this.flip;
        }
    },

    update: function () {
        this.parent();
        //if (ig.system.width)
        //this.kill();
    }
});

});

/*                          
 * ex: set ts=4 sts=0 sw=4 et:
 */
