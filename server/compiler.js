
var Map = require('collections/map.js');


var print = function (text) {
    console.log(text);
}

function codegenBlock(block) {
    var code = "var process_" + block.id + " = function(input){\n" +
                "    return " + block.fname + ".apply(null, input);\n" +
                "}\n";
    return code;
}

function topologicalSort() {
    var blocksToDo = objects.values().map(function (block) { return block.id });

    var blockMarks = new Map();
    objects.keys().forEach(function(id){ blockMarks.set(id, "white") });

    var sortedBlocks = [];

    function visit(blockId) {
        if (blockMarks.get(blockId) === "gray") {
            throw "The block graph is not a DAG (it contains disallowed cycles)";
        }

        if (blockMarks.get(blockId) === "white") {
            blockMarks.get(blockId, "gray");
            objects.get(blockId).outputEndpoints.forEach(function(endp) {
                endp.connections.forEach(function(connection) {
                    visit(connection.targetId);
                });
            });
            blockMarks.get(blockId, "black");
            sortedBlocks.push(objects.get(blockId));
        }
    }

    while (blocksToDo.length > 0) {
        var blockId = blocksToDo.pop();
        visit(blockId);
    }
        
    return sortedBlocks;
}

function codegenBlockRun(block) {
    var code = "";

    // find the input that is connected to that endpoint
    block.inputEndpoints.forEach(function(endpoint, endpointNum) {
        // we can assume at most one connection is present in input endpoint
        if (endpoint.connections.length < 1) 
        //throw "All inputs must be connected!";
            return;


        // a pretty ugly hack to find:
    // * the id of the source block
        var sourceId = endpoint.connections[0].sourceId;
        // * the endpoint number from which we want the value
        var sourceEndpointNum = getEndpointNum(sourceId, endpoint.connections[0].endpoints[0], "output");
        code += "input_" + block.id + "[" + endpointNum + "] = output_" + sourceId + "[" + sourceEndpointNum + "];\n"; 
    });

    code += "output_" + block.id + " = process_" + block.id + "(input_" + block.id + ");\n"
    return code;
}

function compile() {
    var code = "";

    code += objects.values().map(codegenBlock).concat();
    code += topologicalSort().reverse().map(codegenBlockRun).concat();

    return code;
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
    var inputs = jsPlumb.getAllConnections().filter(function(conn) { return conn.target === node });
    var inputValues = inputs.map(function(input) { return run(input.source, false); });

    var outputValues = node.process.apply(null, inputValues);

    if (node.type === "outputBlock") {
        return;
    }

    if (propagate) {
        var outputs = jsPlumb.select({ source: node.id });
        outputs.each(function(output) { run(output.target, true); });
    }
    else {
        return outputValues;
    }
}
