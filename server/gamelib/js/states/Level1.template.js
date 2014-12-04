'use strict';

var WORLD_GRAVITY = 600;
var WALKING_VELOCITY = 130;
var JUMP_VELOCITY = (0.26 * WORLD_GRAVITY + 130);

function Level1() {}

Level1.prototype = {
    preload: function preload() {
        this.game.time.advancedTiming = true;
    },

    create: function create() {
        var game = this.game;

        this.map = this.add.tilemap('super_mario_map');
        this.map.addTilesetImage('SuperMarioBros-World1-1', 'super_mario_tiles');
        this.backgroundLayer = this.map.createLayer('backgroundLayer');
        this.blockingLayer = this.map.createLayer('blockingLayer');

        // 1896 is the maximum number of layers in Tiled
        this.map.setCollisionBetween(1, 1896, true, 'blockingLayer');

        this.backgroundLayer.resizeWorld();
        this.game.camera.reset();

        this.blocks = this.createObjects('block', true);
        this.bonuses = this.createObjects('bonus', true);

        this.player = this.game.add.sprite(100, 0, 'player');
        this.game.physics.arcade.enable(this.player);
        this.player.body.gravity.y = WORLD_GRAVITY;

        this.player.body.collideWorldBounds = true;

        this.player.animations.add('walkLeft', [2, 3, 4], 6, true);
        this.player.animations.add('faceLeft', [5]);
        this.player.animations.add('faceRight', [6]);
        this.player.animations.add('walkRight', [7, 8, 9], 6, true);

        this.player.body.facing = Phaser.RIGHT;

        this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_PLATFORMER);

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.points = 0;
        this.scoreboard = game.add.text(10, 10, '', { font: '6pt Nesfont', fill: '#fff', align: 'center' });
        this.scoreboard.fixedToCamera = true;
        this.setScoreboardText();


        this.gameTimer = game.time.create(false);
        this.gameTimer.add(300000, this.timeOut, this);
        this.gameTimer.start();
        this.timerText = game.add.text(game.width - 35, 10, '', { font: '6pt Nesfont', fill: '#fff', align: 'center' });
        this.timerText.fixedToCamera = true;
        this.updateTimer();

        this.dpad = {};
        this.padButtons = {};

        var buttonLeft = game.add.button(20, game.height - 55, 'buttonHorizontal', null, this, 0, 0, 1, 0);  //game, x, y, key, callback, callbackContext, overFrame, outFrame, downFrame, upFrame
        buttonLeft.fixedToCamera = true;
        buttonLeft.events.onInputDown.add(function () {
            this.dpad.left = true;
        }, this);
        buttonLeft.events.onInputUp.add(function () {
            this.dpad.left = false;
        }, this);
        buttonLeft.scale.setTo(0.3);

        var buttonRight = game.add.button(55, game.height - 55, 'buttonHorizontal', null, this, 0, 0, 1, 0);  //game, x, y, key, callback, callbackContext, overFrame, outFrame, downFrame, upFrame
        buttonRight.fixedToCamera = true;
        buttonRight.events.onInputDown.add(function () {
            this.dpad.right = true;
        }, this);
        buttonRight.events.onInputUp.add(function () {
            this.dpad.right = false;
        }, this);
        buttonRight.scale.setTo(0.3);

        var buttonFire = game.add.button(game.width - 70, game.height - 40, 'buttonA', null, this, 0, 0, 1, 0);
        buttonFire.fixedToCamera = true;
        buttonFire.events.onInputDown.add(function () {
            this.padButtons.A = true;
        }, this);
        buttonFire.events.onInputUp.add(function () {
            this.padButtons.A = false;
        }, this);
        buttonFire.scale.setTo(0.3);

        var buttonJump = game.add.button(game.width - 40, game.height - 70, 'buttonB', null, this, 0, 0, 1, 0);
        buttonJump.fixedToCamera = true;
        buttonJump.events.onInputDown.add(function () {
            this.padButtons.B = true;
        }, this);
        buttonJump.events.onInputUp.add(function () {
            this.padButtons.B = false;
        }, this);
        buttonJump.scale.setTo(0.3);
    },

    setScoreboardText: function setScoreboardText() {
        this.scoreboard.setText('MARIO\n' + this.points);
    },

    timeOut: function timeOut() {
        this.player.kill();
    },

    update: function update() {
        this.game.physics.arcade.collide(this.player, this.bonuses, this.playerHitsBonus, null, this);
        this.game.physics.arcade.collide(this.player, this.blocks, this.playerHitsBlock, null, this);
        this.game.physics.arcade.collide(this.player, this.blockingLayer);

        if (this.player.body.facing === Phaser.LEFT || this.player.body.facing === Phaser.RIGHT) {
            this.player.body.lastFacing = this.player.body.facing;
        }

        if (this.cursors.right.isDown || this.dpad.right) {
            {{{playerMoveRight}}}
        } else if (this.cursors.left.isDown || this.dpad.left) {
            {{{playerMoveLeft}}}
        } else {
            {{{notPressingKeys}}}
        }
        if (this.cursors.up.isDown || this.padButtons.A) {
            {{{playerJump}}}
        }

        this.updateTimer();
    },

    updateTimer: function updateTimer() {
        var time = String(Math.round(this.gameTimer.duration / 1000));
        var MAX_LENGTH = 3;
        while (time.length < MAX_LENGTH) {
            time = '0' + time;
        }
        this.timerText.setText(time);
    },

    playerHitsBlock: function playerHitsBlock(player, obj) {
        {{{playerHitsBlock}}}
    },

    playerHitsBonus: function playerHitsBonus(player, obj) {
        if (obj.body.touching.down) {
            switch (obj.what) {
                {{#each playerHitsBonus}}
                    case '{{@key}}':
                        {{this}}
                    break;
                {{/each}}
            }
            obj.destroy();
        }
    },

    addPlayerCoins: function addPlayerCoins() {
        this.points += 100;
        this.setScoreboardText();
    },

    addPlayerPower: function addPlayerPower(player, obj) {

        var y = obj.y - obj.height;
        if (y < 0) {
            y = 0;
        }
        var power = this.game.add.sprite(obj.x, y, 'power');
        obj.destroy();
        this.game.physics.arcade.enable(power);
        power.body.velocity.x = 70;
        power.body.velocity.y = -70;
        power.body.gravity.y = WORLD_GRAVITY;

        function onTouch(power, obj) {
            if (power.body.touching.right || power.body.blocked.right) {
                power.body.velocity.x = -70;
            } else if (power.body.touching.left || power.body.blocked.left) {
                power.body.velocity.x = 70;
            }
        }

        power.update = function () {
            this.game.physics.arcade.collide(power, this.blockingLayer, onTouch);
            this.game.physics.arcade.collide(power, this.blocks, onTouch);
            this.game.physics.arcade.collide(power, this.bonuses, onTouch);
            this.game.physics.arcade.collide(power, this.player, function (power, player) {
                power.destroy();
            });
        }.bind(this);
    },

    render: function render() {
        this.game.debug.text(this.game.time.fps || '--', 20, 70, "#fff", "40px Courier");
    },

    playerJump: function playerJump() {
        if (this.player.body.touching.down || this.player.body.blocked.down) {
            this.player.body.velocity.y -= JUMP_VELOCITY;
        }
    },

    createObjects: function createObjects(name, immovable) {
        var result = this.game.add.group();
        result.enableBody = true;

        this.findObjectsByName(name, this.map, 'objectsLayer').forEach(function (el) {
            this.createFromTiledObject(el, result, immovable);
        }, this);

        return result;
    },

    findObjectsByName: function findObjectsByName(name, map, layerName) {
        return map.objects[layerName]
            .filter(function (el) {
                return el.name === name;
            })
            .map(function (el) {
                el.y -= map.tileHeight;
                return el;
            });
    },

    createFromTiledObject: function createFromTiledObject(el, group, immovable) {
        var sprite = group.create(el.x, el.y, el.name);
        sprite.body.immovable = immovable;
        Object.keys(el.properties).forEach(function(key){
            sprite[key] = el.properties[key];
        });
    }
};
