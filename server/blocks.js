
var Handlebars = require('handlebars');
var Map = require('collections/map.js');

// blocks

/*
function getParams(blockString) {
    var list = blockString.match(/{{[^}]*}}/g);
    return list.map(function(str) { return str.substring(2, str.length - 2); }
}
*/

// Some library, most probably Collections.js, is overriding .find with a broken
// implementation.
//if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
//}

var predefinedBlocks = [
    {  
        name: "root",
        templateString: "{{root}}",
        params: ["root"]
    },
    {
        name: "increment",
        templateString: "{{variable}} += {{value}};",
        params: ["variable", "value"]
    },
    {
        name: "subtract",
        templateString: "{{variable}} -= {{value}};",
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
        templateString: "if ({{condition}}) { {{ operation }} } else { {{ alternativeOperation }} }",
        params: ["condition", "operation", "alternativeOperation"]
    },

    // some mario-specific tryouts
    {
        name: "playPlayerAnimation",
        templateString: "this.player.animations.play({{animation}})",
        params: ["animation"]
    },
    {
        name: "setPlayerVelocityX",
        templateString: "this.player.body.velocity.x = {{velocity}};",
        params: ["velocity"]
    }
];


function ev(block) {
    //console.log("block");
    //console.log(block);

    // if it's just a string, return it
    if (block.value) 
        return block.value;

    var blockName = block.name;
    var blockData = predefinedBlocks.find(function(p){ return p.name == blockName });

    if (!blockData) 
        throw "No such block (" + blockName + ") exists in the library";

    var templateString = blockData.templateString;
    var params = block.params;
        
    // if it has any params, verify that they've been provided
    var paramList = blockData.params;
    paramList.forEach(function(param){
        if (!params[param])
            throw "A params object is incomplete for this template";
    });

    var evaledParams = {};

    for (var param in params) {
        evaledParams[param] = ev(params[param]);
    }

    var code = Handlebars.compile(templateString, {noEscape:true})(evaledParams);

    return code;
}

var test = [
    {
        name: "playerWhateverHandler",
        connections:[
            {sourceId: "2", targetId:"1", targetEndpointName:"operation"},
            {sourceId: "1", targetId:"root", targetEndpointName:"root"},

            {sourceId: "3", targetId:"1", targetEndpointName:"condition"},
            {sourceId: "4", targetId:"2", targetEndpointName:"condition"},
            {sourceId: "5", targetId:"2", targetEndpointName:"operation"},
        ],
        objects:[
            {id:"1",name:"ifthen"},
            {id:"2", name:"ifthen"},
            {id:"root", name:"root"},
            {id:"3", value: "true"},
            {id:"4", value: "true"},
            {id:"5", value: "console.log('test');"}
        ]
    }
];

function deserializeToBlocks(jsonData) {
    var data = jsonData;

    var deserializeBlock = function(blockData) {
        var connections = blockData.connections;
        var name = blockData.name;
        if (!name)
            throw "A block must have a name";

        var objects = new Map();
        blockData.objects.forEach(function(obj) { objects.set(obj.id, obj); });

        var root = objects.get("root");
        if (!root)
            throw "No root object present in the block " + name;

        var expandObject = function(obj) {
            var conns = connections.filter(function(conn) { return conn.targetId === obj.id; });

            //console.log("mathing connections");
            //console.log(conns);

            // if it's a constant, return it
            if (obj.value) {
                return { value:obj.value };
            }

            var result = { 
                name: obj.name,
                params: { }
            };

            conns.forEach(function(conn) {
                var expandedData = expandObject(objects.get(conn.sourceId));
                result.params[conn.targetEndpointName] = expandedData;
            });

            return result;
        };

        var expandedBlock = expandObject(root);
        return { 
            name: name,
            code: expandedBlock
        };
    };

    var blocks = data.map(deserializeBlock);

    //console.log("blocks");
    //console.log(blocks);

    return blocks;
}

function build(jsonData) {
    var blocks = deserializeToBlocks(jsonData);

    var result = {};

    blocks.forEach(function(block) {
        result[block.name] = ev(block.code);
    });

    return result;
}

//var built = build(test);
//console.log("\n\n\n--------------------------------------\n")
//console.log(built);

module.exports = {
    build: build,
};