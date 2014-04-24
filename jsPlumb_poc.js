 <!doctype html>
 <html><head></head>
 
 <head>
    <style type="text/css">
        div.block {
            background-color: #36C;
            min-width: 200px;
            height: 100px;
            float: left;
            padding: 10px;
            
            text-align: center;
            vertical-align: middle;
            font-size: 3em;
            
            position:absolute;
        }
    </style>
 </head>
 
<body>

<pre id="output"></pre>
<div id="content"></div>

<script src="jquery-2.1.0.js" type="text/javascript"></script>
<script src="jquery-ui-1.10.4.min.js" type="text/javascript"></script>
<script src="jquery.jsPlumb-1.5.5-min.js" type="text/javascript"></script>

<!--script src="underscore-min.js" type="text/javascript"></script-->
<script src="traceur/traceur.js" type="text/javascript"></script>
<script src="traceur/bootstrap.js" type="text/javascript"></script>
<!--
<script src="https://traceur-compiler.googlecode.com/git/bin/traceur.js" 
    type="text/javascript"></script>
<script src="https://traceur-compiler.googlecode.com/git/src/bootstrap.js"
    type="text/javascript"></script>
    
-->
<script>
  traceur.options.experimental = true;
</script>
 
<script>
 
 var instance;
 
 var exampleDropOptions = {
                tolerance:"touch",
                hoverClass:"dropHover",
                activeClass:"dragActive"
            };
 var color2 = "#316b31";
        var exampleEndpoint2 = {
            endpoint:["Dot", { radius:11 }],
            paintStyle:{ fillStyle:color2 },
            isSource:true,
            scope:"green",
            connectorStyle:{ strokeStyle:color2, lineWidth:6 },
            connector: ["Bezier", { curviness:63 } ],
            maxConnections:3,
            isTarget:true,
            dropOptions : exampleDropOptions
        };

</script>
 
<script type="module"> 
 
var print = function () {
    var output = document.getElementById("output");
    return function(text) {
        output.innerText = output.innerText + "\n" + String(text); 
    };
}();

var num = 1;

function createBlock (f) {
    let block = document.createElement('div');   
    block.className = 'block';
    block.innerText = "add";
    block.id = String(num++);
    document.getElementById("content").appendChild(block);
    
    jsPlumb.draggable(block);
    
    f.signature.outs.forEach(function(elem, i) {
        // this formula leaves space before first and after last element
        var pos = (1.0 / (f.signature.outs.length+1)) * (i+1);
        
        jsPlumb.addEndpoint(block, { anchor:[1, pos, 1, 0] }, exampleEndpoint2);
    });
    
    f.signature.ins.forEach(function(elem, i) {
        // this formula leaves space before first and after last element
        var pos = (1.0 / (f.signature.ins.length+1)) * (i+1);
    
        jsPlumb.addEndpoint(block, { anchor:[0, pos, -1, 0] }, exampleEndpoint2);
    });
}

var f = (x,y) => x + y;
f.signature = { ins : ["int", "int"], outs : ["int"] };

var g = (x,y) => x * y;
g.signature = { ins : ["int", "int"], outs : ["int"] };


print(f(1,2));

createBlock(f);
createBlock(g);
 
</script>
 
</body>
 
 </html>