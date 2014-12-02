
Map = require('collections/map.js');
num = 1;
objects = new Map();
blockDefs = new Map();
connections = [];

function createEndpointDef(isParam) {
    var exampleDropOptions = {
        //tolerance: "touch",
        activeClass: "dragActive",

        connector: ["Bezier", { curviness: 1 }],
        endpoint: ["Dot", { radius: 11 }],
    };

    var color = (isParam ? "#999999" : "#cc9999");

    return {
        paintStyle: { fillStyle: color },

        isSource: !isParam,
        isTarget: isParam,

        //scope: "all",
        connectorStyle: { strokeStyle: color, lineWidth: 6 },

        dropOptions: exampleDropOptions,

        maxConnections: (isParam ? 1 : -1),
    };
}

var print = function (text) {
    console.log(text);
}

window.createRootBlock = function() {
    var $block = document.createElement('div');
    $block.className = 'block';
    $block.textContent = "root";
    $block.id = "root";
    document.getElementById("content").appendChild($block);

    jsPlumb.draggable($block);

    var endpoints = [];
    var pos = 0.5;
    var endpointDef = createEndpointDef(true);
    var $endpoint = jsPlumb.addEndpoint($block, { anchor: [1, pos, 1, 0] }, endpointDef);
    $endpoint.name = "root";
    endpoints.push($endpoint);

    objects.set($block.id, {
        blockName: "root",
        id: $block.id,
        blockHandle: $block,
        endpoints: endpoints,
    });

    return $block;
}

window.createConstantBlock = function() {
    var id = String(num++);
    var $block = document.createElement('div');
    $block.className = 'block';
    $block.textContent = "root";
    $block.id = id;

    var $textbox = document.createElement('input');
    $textbox.type = 'text';
    $block.appendChild($textbox);
    document.getElementById("content").appendChild($block);

    jsPlumb.draggable($block);

    var endpoints = [];
    var pos = 0.5;
    var endpointDef = createEndpointDef(true);
    var $endpoint = jsPlumb.addEndpoint($block, { anchor: [1, pos, 1, 0] }, endpointDef);
    $endpoint.name = "root";
    endpoints.push($endpoint);

    objects.set($block.id, {
        blockName: "root",
        id: $block.id,
        blockHandle: $block,
        endpoints: endpoints,
    });

    return $block;
}

window.createBlock = function (blockName, id) {
    id = id || "";
    if (!id) id = String(num++)

    var $block = document.createElement('div');
    $block.className = 'block';
    $block.textContent = blockName;
    $block.id = id;
    document.getElementById("content").appendChild($block);

    jsPlumb.draggable($block);

    var block = blockDefs.get(blockName);
    var endpoints = [];
    var i = 0;

    block.params.forEach(function (param) {
        // this formula leaves space before first and after last element
        var pos = (1.0 / (block.params.length + 1)) * (i + 1);
        var endpointDef = createEndpointDef(true);

        var $endpoint = jsPlumb.addEndpoint($block, { anchor: [1, pos, 1, 0] }, endpointDef);
        $endpoint.name = param;
        endpoints.push($endpoint);

        i += 1;
    });

    if (block.multiParams) {
        block.multiParams.forEach(function(param) {
            var pos = (1.0 / (block.params.length + 1)) * (i + 1);
            var endpointDef = createEndpointDef(true);

            var $endpoint = jsPlumb.addEndpoint($block, { anchor: [1, pos, 1, 0] }, endpointDef);
            $endpoint.name = param;
            endpoints.push($endpoint);

            i += 1;
        });
    }

    // Add source endpoint
    var endpointDef = createEndpointDef(false);
    var $mainEndpoint = jsPlumb.addEndpoint($block, { anchor: [0.5, 1, 0, 1] }, endpointDef)
    endpoints.push($mainEndpoint);

    // todo: repetition
    objects.set($block.id, {
        blockName: blockName,
        id: $block.id,
        blockHandle: $block,
        endpoints: endpoints,
    });

    return $block;
}

window.exportBlocks = function() {
    var exportObjects = objects.values().map(function (object) {
        var positionX = object.blockHandle.offsetLeft;
        var positionY = object.blockHandle.offsetTop;

        // "object" represents logical layer
        // "block" part of it is the display/editor layer
        return {
            id: object.id,
            name: object.blockName,
            block: {
                position: { x: positionX, y: positionY },
            },
        }
    });

    return JSON.stringify({
        connections: connections,
        objects: exportObjects,
    });
}

window.importBlocks = function(data) {
    data = JSON.parse(data);

    objects = new Map();
    $(".block").remove();
    jsPlumb.reset();

    data.objects.forEach(function (object) {
        var block = createBlock(object.fname, object.id);

        // todo: get rid of jQ here
        $(block).offset({
            left: object.block.position.x,
            top: object.block.position.y,
        })
    });
    num += data.objects.length;

    for (var i = 0; i < data.connections.length; i++) {
        var c = data.connections[i];
        var sourceEndpoint = objects.get(c.sourceId).outputEndpoints[c.sourceEndpointName];
        var targetEndpoint = objects.get(c.targetId).inputEndpoints[c.targetEndpointName];

        jsPlumb.connect({ source: sourceEndpoint, target: targetEndpoint });
    }
    connections = data.connections;

    jsPlumbBindHandlers();
    jsPlumb.repaintEverything();
}

function getEndpointName(elementId, endpointObj, type) {
    var object = objects.get(elementId);
    if (!object) {
        throw "No such object";
    }

    // Assume that all blocks have just one output for now
    if (type === "output") {
        return "output";
    }

    var endpointName = "";

    var endpoints = object.endpoints;
    for (var i = 0; i < endpoints.length; i++) {
        if (endpoints[i] === endpointObj) {
            endpointName = endpoints[i].name;
            break;
        }
    }
    if (endpointName === "") {
        throw "Error in connecting; no such endpoint in the element";
    }

    return endpointName;
}

var jsPlumbBindHandlers = function () {
    function jsPlumbConnectionHandler(info) {
        var sourceEndpointName = getEndpointName(info.sourceId, info.sourceEndpoint, "output");
        var targetEndpointName = getEndpointName(info.targetId, info.targetEndpoint, "input")

        connections.push({
            sourceId: info.sourceId,
            targetId: info.targetId,
            sourceEndpointName: sourceEndpointName,
            targetEndpointName: targetEndpointName
        });
    }

    function jsPlumbConnectionDetachedHandler(info) {
        var sourceEndpointName = getEndpointName(info.sourceId, info.sourceEndpoint, "output");
        var targetEndpointName = getEndpointName(info.targetId, info.targetEndpoint, "input");

        for (var i = 0; i < connections.length; i++) {
            var c = connections[i];
            if (c.sourceId === info.sourceId &&
                c.targetId === info.targetId &&
                c.sourceEndpointName === sourceEndpointName &&
                c.targetEndpointName === targetEndpointName) {
                // if it's not the last element, put the last element in its place
                if (i < connections.length - 1) {
                    connections[i] = connections[connections.length - 1];
                }
                connections.pop();
                break;
            }
        }
    }

    return function () {
        jsPlumb.bind("connection", jsPlumbConnectionHandler);
        jsPlumb.bind("connectionDetached", jsPlumbConnectionDetachedHandler);
    }
}();

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
        templateString: "if ({{condition}}) { {{ operation }} } else { {{ alternativeOperation }} }",
        params: ["condition", "operation", "alternativeOperation"]
    }
];

function registerBlock(block) {
    /*var getParams = function (templateString) {
        var list = templateString.match(/{{[^}]*}}/g);
        return list.map(function(str) { return str.substring(2, str.length - 2); }
    };*/

    blockDefs.set(block.name, block);

    $('<input type="button">')
        .on('click', function() { createBlock(block.name) })
        .val(block.name)
        .appendTo("#toolboxSidebar");
}

window.sendDataToServer = function() {
    var data = exportBlocks();

    data.objects.forEach(function(object) {
        object.block = undefined;
    });
}

$(function () {
    jsPlumb.importDefaults({
        EndpointHoverStyle: "cursor: pointer;",
    });

    jsPlumbBindHandlers();

    $("#toolboxSidebar").append('<input type="button" onclick="localStorage[1] = exportBlocks()" value="export"></input>');
    $("#toolboxSidebar").append('<input type="button" onclick="importBlocks(localStorage[1])" value="import"></input>');
    $("#toolboxSidebar").append('<input type="button" onclick="sendToServer()" value="Send To Server"></input>');
    $("#toolboxSidebar").append('<input type="button" onclick="createConstantBlock()" value="Constant"></input>');

    predefinedBlocks.forEach(function(block) {
        registerBlock(block);
    });

    createRootBlock();
});