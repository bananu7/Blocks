
var exampleDropOptions = {
    //tolerance: "touch",
    activeClass: "dragActive",

    connector: ["Bezier", { curviness: 1 }],
    endpoint: ["Dot", { radius: 11 }],
};

function getEndpointColorFromType(type) {
    switch (type) {
        case "int": return "#3399FF";
        case "string": return "#FF9933";
        default: return "#999999";
    }
}

function createTypeEndpoint(type, isInput) {
    var color = getEndpointColorFromType(type);

    return {
        paintStyle: { fillStyle: color },

        scope: type,
        connectorStyle: { strokeStyle: color, lineWidth: 6 },

        dropOptions: exampleDropOptions,

        isSource: !isInput,
        isTarget: isInput,
        maxConnections: (isInput) ? 1 : -1,
    }
}

var print = function () {
    var output = document.getElementById("output");
    return function (text) {
        output.innerText = output.innerText + "\n" + String(text);
    };
}();

function* map(f, xs) {
    for (var x of xs) {
        yield f(x);
    }
}

function mapM_(f, xs) {
    for (var x of xs) {
        f(x);
    }
}

function forM(xs, f) {
    mapM_(f, xs);
}

function* filter(pred, xs) {
    for (var x of xs) {
        if (!pred(x)) {
            continue;
        }
        yield x;
    }
}

/*function* lazify(arr) {
    for (var i = 0; i < arr.length; i++) {
        yield arr[i];
    }
}*/

function seq(lazy) {
    var result = [];

    if (!lazy) {
        return undefined;
    }
    
    var next = lazy.next();
    while (!next.done) {
        result.push(next.value);
        next = lazy.next();
    }

    return result;
}

class Map {
    constructor() {
        this._data = {};
    }

    at (key) {
        return this._data[key];
    }

    insert(key, value) {
        if (this.at(key)) {
            return false;
        } else {
            this._data[key] = value;
            return true;
        }
    }

    remove(key) {
        this._data[key] = undefined;
    }

    *keys() {
        for(var key in this._data) {
            yield key;
        }
    }

    *values() {
        for(var key in this._data) {
            yield this._data[key];
        }
    }

    *pairs() {
        for(var key in this._data) {
            yield [key, this._data[key]];
        }
    }
}


var num = 1;
var objects = new Map();
var functions = new Map();
var connections = [];

function createInput() {
    var block = document.createElement('div');
    block.className = 'socket';
    block.id = "input" + num++;
    document.getElementById("inputSidebar").appendChild(block);

    var input = document.createElement('input');
    block.appendChild(input);

    // this starts propagating change
    input.addEventListener("change", function () {
        //alert("running computations");
        run(block, true);
    }, false);
    // this just passes current value (and is used by input.change)

    block.process = function () {
        return this.value;
    }.bind(input);

    inputs.insert(num, {
        handle: block
    });

    /*objects.insert(block.id, {
        process: block.process,
        id: block.id,
        blockHandle: block,
    });*/

    var endpoint = createTypeEndpoint("string", false);
    jsPlumb.addEndpoint(block, { anchor: [1, 0.5, 1, 0] }, endpoint);
}

function createOutput() {
    var block = document.createElement('div');
    block.className = 'socket';
    block.id = "output" + num++;
    document.getElementById("outputSidebar").appendChild(block);

    var input = document.createElement('input');
    block.appendChild(input);

    block.process = function (input) {
        this.value = input;
    }.bind(input);

    /*objects.insert(block.id,{
        process: block.process,
        id: block.id,
        blockHandle: block,
    });*/

    var endpoint = createTypeEndpoint("string", true);
    jsPlumb.addEndpoint(block, { anchor: [0, 0.5, -1, 0] }, endpoint);
}

function createBlock(fname, id = "") {
    var f = functions.at(fname);
    if (!id) id = String(num++)

    var block = document.createElement('div');
    block.className = 'block';
    block.textContent = f.name;
    block.id = id;
    document.getElementById("content").appendChild(block);

    jsPlumb.draggable(block);

    block.process = f;

    var outputEndpoints = [];
    f.signature.outs.forEach(function (elem, i) {
        // this formula leaves space before first and after last element
        var pos = (1.0 / (f.signature.outs.length + 1)) * (i + 1);
        var endpoint = createTypeEndpoint(elem, false);

        var $endpoint = jsPlumb.addEndpoint(block, { anchor: [1, pos, 1, 0] }, endpoint)
        outputEndpoints.push($endpoint);
    });

    var inputEndpoints = [];
    f.signature.ins.forEach(function (elem, i) {
        // this formula leaves space before first and after last element
        var pos = (1.0 / (f.signature.ins.length + 1)) * (i + 1);
        var endpoint = createTypeEndpoint(elem, true);

        var $endpoint = jsPlumb.addEndpoint(block, { anchor: [0, pos, -1, 0] }, endpoint);
        inputEndpoints.push($endpoint);
    });

    // todo: repetition
    objects.insert(block.id,{
        fname: fname,
        id: block.id,
        blockHandle: block,
        inputEndpoints: inputEndpoints,
        outputEndpoints: outputEndpoints,
    });

    return block;
}


function exportBlocks() {
    var exportObjects = map((object) => {
        var positionX = object.blockHandle.offsetLeft;
        var positionY = object.blockHandle.offsetTop;

        // "object" represents logical layer
        // "block" part of it is the display/editor layer
        return {
            id: object.id,
            fname: object.fname,
            block: {
                position: { x: positionX, y: positionY },
            },
        }
    }, objects.values());

    // Force evaluation of lazy computations for the serialization purpose
    exportObjects = seq(exportObjects);

    return JSON.stringify({
        connections: connections,
        objects: exportObjects,
    });
}

function importBlocks(data) {
    data = JSON.parse(data);

    objects = new Map();
    $(".block").remove();
    jsPlumb.deleteEveryEndpoint();

    forM(data.objects, (object) => {
        var block = createBlock(object.fname, object.id);

        // todo: get rid of jQ here
        $(block).offset({
            left: object.block.position.x,
            top: object.block.position.y,
        })
    });
    num += data.objects.length;

    console.log(data.connections);

    for (var i = 0; i < data.connections.length; i++) {
        var c = data.connections[i];
        var sourceEndpoint = objects.at(c.sourceId).outputEndpoints[c.sourceEndpointNum];
        var targetEndpoint = objects.at(c.targetId).inputEndpoints[c.targetEndpointNum];

        jsPlumb.connect({ source: sourceEndpoint, target: targetEndpoint });
    }
    connections = data.connections;

    jsPlumb.repaintEverything();
}

// Usercode
function add(x, y) {
    return x + y;
}
add.signature = { ins: ["int", "int"], outs: ["int"] };

function mul(x, y) {
    return x * y;
}
mul.signature = { ins: ["int", "int"], outs: ["int"] };

function toUpper(str) {
    return str;
}
toUpper.signature = { ins: ["string"], outs: ["string"] };

function toInt(str) {
    return parseInt(str, 10);
}
toInt.signature = { ins: ["string"], outs: ["int"] };

function toStr(num) {
    return String(num);
}
toStr.signature = { ins: ["int"], outs: ["string"] };

// more like "poke"
function run(node, propagate) {
    // todo: profile that vs select
    var inputs = jsPlumb.getAllConnections().filter((conn) => { return conn.target === node });
    var inputValues = inputs.map((input) => { return run(input.source, false); });

    var outputValues = node.process.apply(null, inputValues);

    if (node.type === "outputBlock") {
        return;
    }

    if (propagate) {
        var outputs = jsPlumb.select({ source: node.id });
        outputs.each((output) => { run(output.target, true); });
    }
    else {
        return outputValues;
    }
}

function registerFunction(f, name = "") {
    if (!name) {
        name = f.name;
    }
    if (!name) {
        throw "You have to supply a function name for anonymous functions.";
    }

    functions.insert(name, f);

    $("#toolboxSidebar").append('<input type="button" onclick="createBlock(\'' + name + '\')" value="' + name + '"></input>');
}

$(function () {
    jsPlumb.importDefaults({
        EndpointHoverStyle : "cursor: pointer;",
    });

    function getEndpointNum(elementId, endpointObj, type) {
        var endpointNum = -1;
        var object = objects.at(elementId);
        if (!object) {
            throw "No such object";
        }

        var endpoints = (type === "input") ? object.inputEndpoints : object.outputEndpoints;
        for (var i = 0; i < endpoints.length; i++) {
            if (endpoints[i] === endpointObj) {
                endpointNum = i;
                break;
            }
        }
        if (sourceEndpointNum === -1) { 
            throw "Error in connecting; no such endpoint in the element"; 
        }

        return endpointNum;
    }

    jsPlumb.bind("connection", (info) => {
        console.log(info);
        var sourceEndpointNum = getEndpointNum(info.sourceId, info.sourceEndpoint, "output");
        var targetEndpointNum = getEndpointNum(info.targetId, info.targetEndpoint, "input")

        connections.push({
            sourceId: info.sourceId,
            targetId: info.targetId,
            sourceEndpointNum: sourceEndpointNum,
            targetEndpointNum: targetEndpointNum
        });
    });

    jsPlumb.bind("connectionDetached", (info) => {

    });

    registerFunction(add);
    registerFunction(mul);
    registerFunction(toInt);
    registerFunction(toStr);

    $("#toolboxSidebar").append('<input type="button" onclick="localStorage[1] = exportBlocks()" value="export"></input>');
    $("#toolboxSidebar").append('<input type="button" onclick="importBlocks(localStorage[1])" value="import"></input>');
    $("#toolboxSidebar").append('<input type="button" onclick="createInput()" value="new input"></input>');
    $("#toolboxSidebar").append('<input type="button" onclick="createOutput()" value="new output"></input>');

    /*createInputBlock();
    createBlock(add);
    createBlock(mul);
    createBlock(toInt);
    createBlock(toString);
    createOutputBlock();*/
});
