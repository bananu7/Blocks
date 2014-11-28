var Hapi = require('hapi');
var server = new Hapi.Server('localhost', 3000);
var Handlebars = require('handlebars');

var fs = require('fs');

var gamelibPath = 'gamelib/';

var logic = require('./logic');

function tag(name, attribs, contents)
{
    return '<' + name + ' ' + attribs + '>' + contents + '</' + name + '>';
}
function scriptTag(path) {
    return tag('script', 'type="text/javascript"', fs.readFileSync(gamelibPath + path));
}

function returnApp() {

    var gameScriptSrc = fs.readFileSync(gamelibPath + "js/states/Level1.template.js", {encoding: 'utf8'});
    var gameScriptTemplate = Handlebars.compile(gameScriptSrc);
    var gameScript = gameScriptTemplate(logic);

    var scripts = ""
        + scriptTag("phaser.min.js")
        + scriptTag("js/states/Boot.js")
        + scriptTag("js/states/Preload.js")
        + scriptTag("js/states/MainMenu.js")
        + tag('script', 'type="text/javascript"', gameScript)
    ;

    var head = ""
        + fs.readFileSync('gamelib/meta.html')
        + scripts
        + '<title>Mario</title>'
    ;

    var body = ""
        + '<div id="gameDiv"></div>'
        + scriptTag("js/main.js")
    ;

    var appTemplateSrc =
    '<!doctype html>\n'
    +'<html>\n'
    +'<head>\n{{{head}}}\n</head>\n'
    +'<body>\n{{{body}}}\n</body>\n'
    +'</html>';

    var appTemplate = Handlebars.compile(appTemplateSrc);
    var app = appTemplate({
        head : head,
        body : body
    });

    return app;
}

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!<br><a href="/app">Game</a>');
    }
});

server.route({
    method: 'GET',
    path: '/app',
    handler: function (request, reply) {
        var app = returnApp();
        reply(app);
    }
});

server.route({
    method: 'GET',
    path: '/images/{name}',
    handler: function (request, reply) {
        reply.file('data/images/' + request.params.name)
    }
});

server.route({
    method: 'GET',
    path: '/tilemaps/{name}',
    handler: function (request, reply) {
        reply.file('data/tilemaps/' + request.params.name)
    }
});

server.route({
    method: 'POST',
    path: '/assets/player',
    config: {
        payload:{
            output: 'stream',
            parse: true,
            allow: 'multipart/form-data'
        },
        handler: function (request, reply) {
            var data = request.payload;
            if (data.player_sprite) {
                var name = data.player_sprite.hapi.filename;
                var path = __dirname + "/data/images/player.png";
                var file = fs.createWriteStream(path);

                file.on('error', function (err) {
                    console.error(err)
                });

                data.player_sprite.pipe(file);

                data.player_sprite.on('end', function (err) {
                    var ret = {
                        filename: data.player_sprite.hapi.filename,
                        headers: data.player_sprite.hapi.headers
                    };
                    reply(JSON.stringify(ret));
                });
            } else {
                reply("No no");
            }
        }
    }
})

server.start(function () {
    console.log('Server running at:', server.info.uri);
});