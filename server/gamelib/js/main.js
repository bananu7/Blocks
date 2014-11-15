var game = new Phaser.Game(320, 240, Phaser.AUTO, 'gameDiv', null);

//Phaser.Loader.baseURL = 'http://mmiszy.pl/mario-boilerplate/';

game.state.add('Boot', Boot, false);
game.state.add('Preload', Preload, false);
game.state.add('MainMenu', MainMenu, false);
game.state.add('Level1', Level1, false);

game.state.start('Boot');
