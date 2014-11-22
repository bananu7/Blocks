
// blocks

function getParams(blockString) {
    var list = blockString.match(/{{[^}]*}}/g);
    return list.map(function(str) { return str.substring(2, str.length - 2); }
}

function ev(params, blockString) {
    var paramList = getParams(blockString);
}

function combine(listOfBlocks) {

}


var constant = "{{value}}";
var ifthen = "if ({{condition}}) { {{ block }} }";
var ifthenelse = "if ({{condition}}) { {{ block }} } else { {{ elseblock }} }";
var increment = "{{variable}} += {{value}};";
var set = "{{variable}} = {{value}}";

// some mario-specific tryouts
var playPlayerAnimation = "this.player.animations.play({{animation}})";
var setPlayerVelocityX = "this.player.body.velocity.x = {{velocity}};"