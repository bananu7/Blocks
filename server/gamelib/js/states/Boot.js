'use strict';

function Boot() {}

Boot.prototype = {
    preload: function preload() {
        this.load.image('preloadBar', 'images/loader.png');
    },

    create: function create() {
        this.input.maxPointers = 10;
        this.stage.disableVisibilityChange = true;

        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.setMinMax(480, 260, 1024, 768);
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;

        if (!this.game.device.desktop)
        {
            this.scale.forceOrientation(true, false);
            this.scale.setResizeCallback(this.gameResized, this);
            this.scale.enterIncorrectOrientation.add(this.enterIncorrectOrientation, this);
            this.scale.leaveIncorrectOrientation.add(this.leaveIncorrectOrientation, this);
        }

        this.scale.setScreenSize(true);
        this.scale.refresh();

        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.game.state.start('Preload', true, false);
    },

    gameResized: function gameResized() {
        // do something
    },

    enterIncorrectOrientation: function enterIncorrectOrientation() {
        // do something
        // eg. pause the game
    },

    leaveIncorrectOrientation: function leaveIncorrectOrientation() {
        // do something
    }
};
