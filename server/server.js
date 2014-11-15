var Hapi = require('hapi');
var server = new Hapi.Server(3000);

var fs = require('fs');

var gamelibPath = 'gamelib/';

function tag(name, attribs, contents) {
    return '<' + name + ' ' + attribs + '>' + contents + '</' + name + '>';
}
function scriptTag(path) {
    return tag('script', 'type="text/javascript"', fs.readFileSync(gamelibPath + path));
}

function returnApp() {
    var app = "<!doctype html>";

    app += '<html>';

    var scripts = ""
        + scriptTag("phaser.min.js")
        + scriptTag("js/states/Boot.js")
        + scriptTag("js/states/Preload.js")
        + scriptTag("js/states/MainMenu.js")
        + scriptTag("js/states/Level1.js")
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

    app += tag('head', '', head);
    app += tag('body', '', body);

    app += '</html>';

    return app;
}

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
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

server.start(function () {
    console.log('Server running at:', server.info.uri);
});