
//var blocks = require("blocks");

var logic = {
    keys: {

        right: "this.player.body.velocity.x = WALKING_VELOCITY;"
             + "this.player.animations.play('walkRight');",
        left: "this.player.body.velocity.x = -WALKING_VELOCITY;"
             +"this.player.animations.play('walkLeft');",
        up:   "this.playerJump();"
    }
}

function build(lg) {
	
}

    	/*right: [
    		{ block: setPlayerVelocityX, value: 'WALKING_VELOCITY' },
    		{ block: playPlayerAnimation, value: 'walkRight' }
    	],*/

module.exports = logic;