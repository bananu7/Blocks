var logic = {
    keys: {
        right: "this.player.body.velocity.x = WALKING_VELOCITY;"
             + "this.player.animations.play('walkRight');",
        left: "this.player.body.velocity.x = -WALKING_VELOCITY;"
             +"this.player.animations.play('walkLeft');",
        up:   "this.playerJump();"
    }
}

return logic;