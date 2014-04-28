
var exampleDropOptions = {
    tolerance: "touch",
    hoverClass: "dropHover",
    activeClass: "dragActive",

    connector: ["Bezier", { curviness: 1 }],
    maxConnections: 3,
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

function createInputBlock() {
    var block = document.createElement('div');
    block.className = 'block';
    block.id = "inputBlock" + num;
    document.getElementById("content").appendChild(block);

    var input = document.createElement('input');
    block.appendChild(input);

    // this starts propagating change
    input.addEventListener("change", function () {
        alert("running computations");
        run(block, true);
    }, false);
    // this just passes current value (and is used by input.change)

    block.process = function () {
        return this.value;
    }.bind(input);

    objects.insert(block.id, {
        process: block.process,
        id: block.id,
    });

    jsPlumb.draggable(block);
    var endpoint = createTypeEndpoint("string", false);
    jsPlumb.addEndpoint(block, { anchor: [1, 0.5, 1, 0] }, endpoint);
}

function createOutputBlock() {
    var block = document.createElement('div');
    block.className = 'block';
    block.id = "outputBlock" + num;
    block.type = "outputBlock"; //temp
    document.getElementById("content").appendChild(block);

    var input = document.createElement('input');
    block.appendChild(input);

    block.process = function (input) {
        this.value = input;
    }.bind(input);

    objects.insert(block.id,{
        process: block.process,
        id: block.id,
    });

    jsPlumb.draggable(block);
    var endpoint = createTypeEndpoint("string", true);
    jsPlumb.addEndpoint(block, { anchor: [0, 0.5, -1, 0] }, endpoint);
}

function createBlock(f) {
    var block = document.createElement('div');
    block.className = 'block';
    block.textContent = f.name;
    block.id = String(num++);
    document.getElementById("content").appendChild(block);

    jsPlumb.draggable(block);

    block.process = f;

    // todo: repetition
    objects.insert(block.id,{
        process: block.process,
        id: block.id,
    });

    f.signature.outs.forEach(function (elem, i) {
        // this formula leaves space before first and after last element
        var pos = (1.0 / (f.signature.outs.length + 1)) * (i + 1);
        var endpoint = createTypeEndpoint(elem, false);

        jsPlumb.addEndpoint(block, { anchor: [1, pos, 1, 0] }, endpoint);
    });

    f.signature.ins.forEach(function (elem, i) {
        // this formula leaves space before first and after last element
        var pos = (1.0 / (f.signature.ins.length + 1)) * (i + 1);
        var endpoint = createTypeEndpoint(elem, true);

        jsPlumb.addEndpoint(block, { anchor: [0, pos, -1, 0] }, endpoint);
    });
}


function exportBlocks() {
    var connections = jsPlumb.getAllConnections();
    var exportObjects = map(objects, function (object) {
        var $position = $("#" + object.id).position();

        // "object" represents logical layer
        // "block" part of it is the display/editor layer
        object.block = {
            position: { x: $position.left, y: $position.top },
        };

        return object;
    });

    return {
        connections: connections,
        objects: exportObjects,
    };
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

function toString(num) {
    return String(num);
}
toString.signature = { ins: ["int"], outs: ["string"] };

// more like "poke"
function run(node, propagate) {
    // todo: profile that vs select
    var inputs = jsPlumb.getAllConnections().filter(function (conn) { return conn.target === node });
    var inputValues = inputs.map(function (input) { return run(input.source, false); });

    var outputValues = node.process.apply(null, inputValues);

    if (node.type === "outputBlock") {
        return;
    }

    if (propagate) {
        var outputs = jsPlumb.select({ source: node.id });
        outputs.each(function (output) { run(output.target, true); });
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

    $("body").append('<input type="button" onclick="createBlock(' + name + ')" value="' + name + '"></input>');
}

$(function () {
    registerFunction(add);
    registerFunction(mul);
    registerFunction(toInt);
    registerFunction(toString);

    /*createInputBlock();
    createBlock(add);
    createBlock(mul);
    createBlock(toInt);
    createBlock(toString);
    createOutputBlock();*/
});
