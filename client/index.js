
Map = require('collections/map.js');

num = 1;

blockDefs = new Map();
objects = new Map();
connections = [];
unitName = "playerjump";

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

window.createBlockBase = function(displayLabel, id) {
    if (!id) id = String(num++)
    var $block = document.createElement('div');
    $block.className = 'block';
    $block.id = id;

    document.getElementById("content").appendChild($block);

    var $closeButton = document.createElement('div');
    $closeButton.className = "closeButton";
    $closeButton.addEventListener("click", function() {
        // remove all endpoints
        objects.get(this.id).endpoints.forEach(function(endp) {
            jsPlumb.deleteEndpoint(endp);
        });

        // remove all the connections from and to it
        jsPlumb.detachAllConnections(this, {fireEvent:false});
        connections.forEach(function(c) {
            if (c.sourceId === this.id || c.targetId === this.id) 
                delete c;
        });

        // Unlink it from DOM
        this.parentElement.removeChild(this);

        // remove the object from the table
        objects.delete(this.id);
    }.bind($block));
    $block.appendChild($closeButton);

    var $label = document.createElement('span');
    $label.innerText = displayLabel;
    $block.appendChild($label);

    jsPlumb.draggable($block);

    return $block;
}

window.createRootBlock = function() {
    var $block = createBlockBase('root', 'root');

    var endpoints = [];
    var pos = 0.5;
    var endpointDef = createEndpointDef(true);
    var $endpoint = jsPlumb.addEndpoint($block, { anchor: [1, pos, 1, 0] }, endpointDef);
    $endpoint.endpointName = "root";
    endpoints.push($endpoint);

    objects.set($block.id, {
        blockName: "root",
        id: $block.id,
        blockHandle: $block,
        endpoints: endpoints,
        type: 'root',
    });

    return $block;
}

window.createConstantBlock = function(value, name, id) {
    var $block = createBlockBase(name, id);

    var endpoints = [];
    var pos = 0.5;
    var endpointDef = createEndpointDef(false);
    var $endpoint = jsPlumb.addEndpoint($block, { anchor: [0.5, 1, 0, 1] }, endpointDef);
    $endpoint.endpointName = "output";
    endpoints.push($endpoint);

    objects.set($block.id, {
        id: $block.id,
        value: value,
        blockHandle: $block,
        endpoints: endpoints,
        type: 'constant',
    });

    return $block;
}

window.createParameterBlock = function(id, initialValue) {
    if(!initialValue) initialValue = "";

    var $block = createBlockBase("", id);

    var $textbox = document.createElement('input');
    $textbox.type = 'text';
    $textbox.id = 'parameter_' + $block.id;
    $textbox.value = initialValue;
    $block.appendChild($textbox);

    var endpoints = [];
    var pos = 0.5;
    var endpointDef = createEndpointDef(false);
    var $endpoint = jsPlumb.addEndpoint($block, { anchor: [0.5, 1, 0, 1] }, endpointDef);
    $endpoint.endpointName = "output";
    endpoints.push($endpoint);

    objects.set($block.id, {
        id: $block.id,
        blockHandle: $block,
        endpoints: endpoints,
        type: 'parameter',
    });

    return $block;
}

window.createBlock = function (blockName, id) {
    var $block = createBlockBase(blockName, id);
    var block = blockDefs.get(blockName);

    if(!block) 
        throw "No block named " + blockName + " found in the library!";

    var endpoints = [];
    var i = 0;

    block.params.forEach(function (param) {
        // this formula leaves space before first and after last element
        var pos = (1.0 / (block.params.length + 1)) * (i + 1);
        var endpointDef = createEndpointDef(true);

        var $endpoint = jsPlumb.addEndpoint($block, { anchor: [1, pos, 1, 0] }, endpointDef);
        $endpoint.endpointName = param;
        endpoints.push($endpoint);

        i += 1;
    });

    if (block.multiParams) {
        block.multiParams.forEach(function(param) {
            var pos = (1.0 / (block.params.length + 1)) * (i + 1);
            var endpointDef = createEndpointDef(true);

            var $endpoint = jsPlumb.addEndpoint($block, { anchor: [1, pos, 1, 0] }, endpointDef);
            $endpoint.endpointName = param;
            endpoints.push($endpoint);

            i += 1;
        });
    }

    // Add output endpoint
    var endpointDef = createEndpointDef(false);
    var $outputEndpoint = jsPlumb.addEndpoint($block, { anchor: [0.5, 1, 0, 1] }, endpointDef)
    $outputEndpoint.endpointName = "output";
    endpoints.push($outputEndpoint);

    // todo: repetition
    objects.set($block.id, {
        blockName: blockName,
        id: $block.id,
        blockHandle: $block,
        endpoints: endpoints,
        type: 'block',
    });

    return $block;
}

window.exportBlocks = function() {
    var exportObjects = objects.values().map(function (object) {
        var positionX = object.blockHandle.offsetLeft;
        var positionY = object.blockHandle.offsetTop;

        // "object" represents logical layer
        // "block" part of it is the display/editor layer

        var serializedBlock = {
            id: object.id,
            block: {
                position: { x: positionX, y: positionY },
            },
            type: object.type,
        };

        switch (object.type) {
        case 'root':
            serializedBlock.name = 'root';
            break;
        case 'block':
            serializedBlock.name = object.blockName;
            break;
        case 'parameter':
            var $textbox = document.getElementById('parameter_' + object.id);
            serializedBlock.value = $textbox.value;
            break;
        case 'constant':
            serializedBlock.value = object.value;
            break;
        default:
            throw "Unknown block type";
        }

        return serializedBlock;
    });

    return {
        name: unitName,
        connections: connections,
        objects: exportObjects,
    };
}

window.importBlocks = function(data) {
    objects = new Map();
    $(".block").remove();
    jsPlumb.reset();

    num = 0;

    data.objects.forEach(function (object) {
        if (object.id !== "root" && object.id > num) {
            num = Number(object.id);
        }

        var $block;
        switch (object.type) {
        case 'root':
            $block = createRootBlock();
            break;
        case 'block':
            $block = createBlock(object.name, object.id);
            break;
        case 'parameter':
            $block = createParameterBlock(object.id, object.value);
            break;
        case 'constant':
            $block = createConstantBlock(object.value, object.value, object.id);
            break;
        }

        // todo: get rid of jQ here
        $($block).offset({
            left: object.block.position.x,
            top: object.block.position.y,
        })
    });
    num += 1;

    for (var i = 0; i < data.connections.length; i++) {
        var c = data.connections[i];
        var sourceEndpoint = objects.get(c.sourceId).endpoints.find(function(e) { return e.endpointName === "output" });
        var targetEndpoint = objects.get(c.targetId).endpoints.find(function(e) { return e.endpointName === c.targetEndpointName });

        jsPlumb.connect({ source: sourceEndpoint, target: targetEndpoint });
    }
    connections = data.connections;

    jsPlumbBindHandlers();
    jsPlumb.repaintEverything();
}

var jsPlumbBindHandlers = function () {
    function jsPlumbConnectionHandler(info) {
        var targetEndpointName = info.targetEndpoint.endpointName;

        connections.push({
            sourceId: info.sourceId,
            targetId: info.targetId,
            targetEndpointName: targetEndpointName
        });
    }

    function jsPlumbConnectionDetachedHandler(info) {
        var targetEndpointName = info.targetEndpoint.endpointName;

        for (var i = 0; i < connections.length; i++) {
            var c = connections[i];
            if (c.sourceId === info.sourceId &&
                c.targetId === info.targetId &&
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
        params: ["variable", "value"]
    },
    {
        name: "subtract",
        params: ["variable", "value"]
    },
    {
        name: "set",
        params: ["variable", "value"]
    },
    {
        name: "sequence",
        params: [],
        multiParams: ["operations"]
    },
    {
        name: "ifthen",
        params: ["condition", "operation"]
    },
    {
        name: "ifthenelse",
        params: ["condition", "operation", "alternativeOperation"]
    }
];

var constants = new Map();
constants.set('player_jump_velocity',{
    value: 'JUMP_VELOCITY',
    str: "Player Jump Velocity"
});
constants.set('player_walk_velocity',{
    value: 'WALKING_VELOCITY',
    str: "Player Walk Velocity"
})
constants.set('player_jump_not_blocked', {
    value: 'this.player.body.touching.down || this.player.body.blocked.down',
    str: 'Player jump not blocked'
});
constants.set('player_vel_y', {
    value: 'this.player.body.velocity.y',
    str: 'player vel Y'
});
constants.set('player_vel_x', {
    value: 'this.player.body.velocity.x',
    str: 'player vel X'
});

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

window.registerConstant = function(value, name) {
    name = name || value;

    $('<input type="button">')
        .on('click', function() { createConstantBlock(value, name); })
        .val(name)
        .appendTo("#toolboxSidebar");
}

window.result = "";
window.sendToServer = function() {
    var data = exportBlocks();

    $.ajax({ 
        type: "POST",
        url: "http://localhost:3000/blocks",
        data: exportBlocks()
    })
    .done(function(d){
        console.log("Build complete");
        window.result = d;
    });
}

window.saveBlocks = function(name) {
    var j = JSON.stringify(exportBlocks());
    localStorage[name]= j;
}

window.loadBlocks = function(name) {
    unitName = name;
    if (localStorage[unitName]) {
        var j = JSON.parse(localStorage[unitName]);
        importBlocks(j);
    } else {
        var j = {
            connections: [],
            objects: [],
            name: unitName
        };

        importBlocks(j);
        createRootBlock();

        saveBlocks(unitName);
    }
}

window.downloadLogicFile = function() {    
    var blob = new Blob([localStorage[unitName]], {type : 'text/json'});
    saveAs(blob, unitName + ".json");
}

$(function () {
    jsPlumb.importDefaults({
        EndpointHoverStyle: "cursor: pointer;",
    });

    jsPlumbBindHandlers();

    $("#toolboxSidebar").append('<hr>');

    $("#toolboxSidebar").append('<input type="button" onclick="saveBlocks(unitName)" value="Save To LocalStorage"></input>');
    $("#toolboxSidebar").append('<input type="button" onclick="sendToServer()" value="Send To Server"></input>');
    $("#toolboxSidebar").append('<input type="button" onclick="downloadLogicFile()" value="Download Diagram"></input>');
    $("#toolboxSidebar").append('<input type="button" onclick="createParameterBlock()" value="New Parameter"></input>');

    $("#toolboxSidebar").append('<hr>');

    $("#fieldList").change(function() {
        saveBlocks(unitName);
        loadBlocks($(this).val());
    });

    constants.forEach(function(constant, constantKey) {
        registerConstant(constant.value, constant.str);
    });

    $("#toolboxSidebar").append('<hr>');

    predefinedBlocks.forEach(function(block) {
        registerBlock(block);
    });

    loadBlocks("playerJump");
});