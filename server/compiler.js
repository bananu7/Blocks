"use strict";

var Map = require('collections/map.js');

var test = require('./tests/test3.js').test;
var testStr = JSON.stringify(test);

function topologicalSort(ast) {
    var blocksToDo = ast.objects.keys(); //ast.objects.values().map(function (block) { return block.id; });

    var blockMarks = new Map();
    ast.objects.keys().forEach(function (id) { blockMarks.set(id, "white"); });

    var sortedBlocks = [];

    function visit(blockId) {
        if (blockMarks.get(blockId) === "gray") {
            throw "The block graph is not a DAG (it contains disallowed cycles)";
        }

        if (blockMarks.get(blockId) === "white") {
            blockMarks.set(blockId, "gray");

            var outputConnections = ast.connections.filter(function (conn) { return conn.sourceId === blockId; });
            outputConnections.forEach(function (conn) {
                visit(conn.targetId);
            });

            blockMarks.set(blockId, "black");
            sortedBlocks.push(ast.objects.get(blockId));
        }
    }

    while (blocksToDo.length > 0) {
        var blockId = blocksToDo.pop();
        visit(blockId);
    }

    return sortedBlocks;
}

function parseAst(astStr) {
    var ast = JSON.parse(astStr);

    /*
    Here is the JSON annotation.
    It's a comment, because this language doesn't really
    allow me to express it as data

    Type = "int" | "string" | ...

    list of fns present in this compilation file [
        {
            name: String
            objects: all of the blocks {
                kind: "input" | "output" | "block",
                id: Int,
                if kind is "input" or "output"
                    type: Type
                else
                    fname: String
            }
            connections: connections between the blocks {
                id: Int, -- the connection id
                sourceId: Int, targetId: Int, -- ids of source and target objets
                sourceEndpoint: Int, -- number of endpoint to which the connection is connected
                targetEndpoint: Int
            }
        }
    ]
    */

    var arrayToMap = function (arr) {
        var m = new Map;
        for (var i = 0; i < arr.length; i++) {
            m.set(arr[i].id, arr[i]);
        }
        return m;
    }

    var fns = [];
    ast.forEach(function(fn) {
        var objects = arrayToMap(fn.objects);
        var connections = arrayToMap(fn.connections);
        fns.push({ 
            name: fn.name,
            objects: objects,
            connections: connections
        });
    });

    return fns;
}

function codegenBlock(ast, blockId) {
    var code = "";
    var block = ast.objects.get(blockId);

    code += "var process_" + block.id + " = function(input){\n" +
            "    return " + block.fname + ".apply(null, input);\n" +
            "}\n";

    var inputConnections = ast.connections.filter(function (conn) { return conn.targetId === block.id; });

    inputConnections.forEach(function (conn, endpointNum) {
        // * the id of the source block
        var sourceId = conn.sourceId;
        // * the endpoint number from which we want the value
        var sourceEndpoint = conn.sourceEndpoint;

        code += "input_" + block.id + "[" + endpointNum + "] = output_" + sourceId + "[" + sourceEndpoint + "];\n";
    });

    code += "output_" + block.id + " = process_" + block.id + "(input_" + block.id + ");\n";
    return code;
}

function codegenInput(ast, blockId) {
    var code = "output_" + blockId + "[1] = 'VALUE OF INPUT " + blockId + "';\n";
    return code;
}

function codegenOutput(ast, blockId) {
    var connections = ast.connections.filter(function (conn) { return conn.targetId === blockId; });

    if (connections.length < 1) {
        throw "An output has no connections attached!";
    }

    if (connections.length > 1) {
        throw "An output can only have one connection attached!";
    }

    var conn = connections.values()[0];

    var code = "input_" + blockId + "[1] = output_" + conn.sourceId + "[" + conn.sourceEndpoint + "]\n";
    return code;
}

function codegen(fn, objId) {
    var obj = fn.objects.get(objId);
    if (obj.kind === "block") 
        return "// block\n" + codegenBlock(fn, objId);
    else if (obj.kind === "input")
        return "// input\n" + codegenInput(fn, objId);
    else if (obj.kind === "output")
        return "// output\n" + codegenOutput(fn, objId)
    else
        throw "Unknown block type";
}
 
function compile(astStr) {
    var ast = parseAst(astStr);

    var code = "";

    ast.forEach(function(fn) {
        code += "// BLOCK " + fn.name + "\n";

        var sortedBlocks = topologicalSort(fn).reverse();

        sortedBlocks.forEach(function (block) {
            code += codegen(fn, block.id);
        });
    });

    return code;
}


function dumpError(err) {
    if (typeof err === 'object') {
        if (err.message) {
            console.log('\nMessage: ' + err.message)
        }
        if (err.stack) {
            console.log('\nStacktrace:')
            console.log('====================')
            console.log(err.stack);
        }
    } else {
        console.log('dumpError :: argument is not an object');
    }
}

try {
    var artifact = compile(testStr);
    console.log("Build succeded\n");
    console.log(artifact);
} catch(err) {
    console.log(err);
    dumpError(err);
}
