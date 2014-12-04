
//var blocks = require("blocks");

 var logic = {
    playerMoveRight: ["this.player.body.velocity.x = WALKING_VELOCITY;",
                    "this.player.animations.play('walkRight');"].join('\n'),

    playerMoveLeft: ["this.player.body.velocity.x = -WALKING_VELOCITY;",
                   "this.player.animations.play('walkLeft');"].join('\n'),

    playerJump: ["if (this.player.body.touching.down || this.player.body.blocked.down) {",
               "   this.player.body.velocity.y -= JUMP_VELOCITY;",
               "}"].join('\n'),

    notPressingKeys: ["if (this.player.body.lastFacing === Phaser.LEFT) {",
                          "   this.player.animations.play('faceLeft');",
                          "} else {",
                          "   this.player.animations.play('faceRight');",
                          "}",
                          "this.player.body.velocity.x = 0;"].join('\n'),

    playerHitsBlock: ["if (obj.body.touching.down) {",
                      "   obj.destroy();",
                      "}"].join('\n'),

    playerHitsBonus: {
        coin: ["this.points += 100;",
                "this.setScoreboardText();"].join('\n'),
        power: "this.addPlayerPower(player, obj);"
    }
}

module.exports = logic;