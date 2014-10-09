"use strict";

var Map = require('collections/map.js');

var http = require('http');
var url = require('url');

function duplicate(x) {
    return x;
}
duplicate.signature = { ins: ["string"], outs: ["string"] };


var test = require('./tests/test2.js').test;
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

    var arrayToMap = function (arr) {
        var m = new Map;
        for (var i = 0; i < arr.length; i++) {
            m.set(arr[i].id, arr[i]);
        }
        return m;
    }

    var objects = arrayToMap(ast.objects);
    var connections = arrayToMap(ast.connections);

    return { objects: objects, connections: connections };
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

function codegen(ast, objId) {
    if (ast.objects.get(objId).kind === "block") 
        return "// block\n" + codegenBlock(ast, objId);
    else if (ast.objects.get(objId).kind === "input")
        return "// input\n" + codegenInput(ast, objId);
    else if (ast.objects.get(objId).kind === "output")
        return "// output\n" + codegenOutput(ast, objId)
    else
        throw "Unknown block type";
}
 
function compile(astStr) {
    var ast = parseAst(astStr);
    var sortedBlocks = topologicalSort(ast).reverse();

    var code = "";
    sortedBlocks.forEach(function (block) {
        code += codegen(ast, block.id);
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
    not_defined.function_call();
} catch(err) {
    var artifact = compile(testStr);
    console.log("Build succeded\n");
    console.log(artifact);
}

/*
http.createServer(function (request, response) {
    if (request.method !== 'GET') {
        response.writeHead(400, { 'Content-Type': 'text/plain' });
        response.write("Use a GET request");
        response.end();
    }

    var data = url.parse(request.url);
    var artifact = compile(data);

    response.writeHead(200, { 'Content-Type': 'text/javascript' });
    response.write(artifact);
    response.end();
}).listen(9615);
*/