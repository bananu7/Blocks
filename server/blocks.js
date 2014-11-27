
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

var predefinedBlocks = [
    {
        name: "increment",
        templateString: "{{variable}} += {{value}};",
        params: ["variable", "value"]
    },
    {
        name: "set",
        templateString: "{{variable}} = {{value}}",
        params: ["variable", "value"]
    },
    {
        name: "sequence",
        templateString: "{{#each operations}}{{this}}{{/each}}",
        params: [],
        multiParams: ["operations"]
    },
    {
        name: "ifthen",
        templateString: "if ({{condition}}) { {{ operation }} }",
        params: ["condition", "operation"]
    },
    {
        name: "ifthenelse",
        templateString: "if ({{condition}}) { {{ operation }} } else { {{ alternativeOperation }} }";
        params: ["condition", "operation", "alternativeOperation"]
    }
];


// some mario-specific tryouts
var playPlayerAnimation = "this.player.animations.play({{animation}})";
var setPlayerVelocityX = "this.player.body.velocity.x = {{velocity}};"
