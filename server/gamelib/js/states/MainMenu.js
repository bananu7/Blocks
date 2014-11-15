'use strict';

function MainMenu() {}

MainMenu.prototype = {
    buttonStart: Phaser.Button,

    create: function create() {
        this.buttonStart = this.add.button(this.world.centerX, this.world.centerY, 'buttonRed', this.startGame, this, 0, 0, 1, 0);
        this.buttonStart.anchor.setTo(0.5, 0.5);
    },

    startGame: function startGame() {
        this.game.state.start('Level1', true, false);
    }
};
