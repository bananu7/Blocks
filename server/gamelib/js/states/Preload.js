'use strict';

function Preload() {}

Preload.prototype = {
    preload: function preload() {
        document.querySelector('html').style.background = 'black';
        this.preloadBar = this.add.sprite(this.world.centerX, this.world.centerY, 'preloadBar');
        this.preloadBar.anchor.setTo(0.5, 0.5);
        this.load.setPreloadSprite(this.preloadBar);


        // all assets go here
        this.load.spritesheet('buttonRed', 'images/buttonRed.png', 298, 56);

        this.load.image('super_mario_tiles', 'tilemaps/super_mario.png');
        this.load.tilemap('super_mario_map', 'tilemaps/super_mario.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('block', 'tilemaps/block.png');
        this.load.image('bonus', 'tilemaps/bonus.png');
        this.load.image('power', 'tilemaps/power.png');

        this.load.spritesheet('buttonHorizontal', 'images/button-horizontal.png', 96, 64);
        this.load.spritesheet('buttonA', 'images/button-round-a.png', 96, 96);
        this.load.spritesheet('buttonB', 'images/button-round-b.png', 96, 96);

        this.load.spritesheet('player', 'images/player.png', 32, 32);
    },

    create: function create() {
        var tween = this.add.tween(this.preloadBar).to({ alpha: 0 }, 1000, Phaser.Easing.Linear.None, true);
        tween.onComplete.add(this.startMainMenu, this);

    },

    startMainMenu: function startMainMenu() {
        this.game.state.start('Level1', true, false);
    }
};
