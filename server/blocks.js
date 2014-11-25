
var Handlebars = require('handlebars')

// blocks

function getParams(blockString) {
    var list = blockString.match(/{{[^}]*}}/g);
    return list.map(function(str) { return str.substring(2, str.length - 2); }
}

function ev(block) {
    var blockName = block.name;
    var templateString = block.templateString;
    var params = block.params;

    var paramList = getParams(templateString);

    if (paramList.length === 0) {
        // it's just a string
        return templateString;
    }

    // if it has any params, verify that they've been provided
    paramList.forEach(function(param){
        if (!params[param])
            throw "A params object is incomplete for this template";
    });
    
    var evaledParams = {};

    for (var param in params) {
        evaledParams[param.name] = ev(param);
    }

    var code = Handlebars.compile(templateString)(evaledParams);

    return code;
}

function combine(listOfBlocks) {
    
}


var constant = "{{value}}";
var ifthen = "if ({{condition}}) { {{ block }} }";
var ifthenelse = "if ({{condition}}) { {{ block }} } else { {{ elseblock }} }";
var increment = "{{variable}} += {{value}};";
var set = "{{variable}} = {{value}}";

// some mario-specific tryouts
var playPlayerAnimation = "this.player.animations.play({{animation}})";
var setPlayerVelocityX = "this.player.body.velocity.x = {{velocity}};"
