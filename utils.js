
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

// performs automatic generator detection
function* lazify(arr) {
    if (arr.hasOwnProperty("next")) {
        for (var x of arr) {
            yield x;
        }
} else {
        for (var i = 0; i < arr.length; i++) {
            yield arr[i];
        }
}
}

// this has forced lazify because it's not using for..of
function foldl1(f, xs) {
    xs = lazify(xs);
    var a = xs.next().value;
    var b;
    while(b = xs.next(), !b.done) {
        a = f(a,b.value);
    }
    return a;
}

function* filter(pred, xs) {
    for (var x of xs) {
        if (!pred(x)) {
            continue;
        }
        yield x;
    }
}

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

export default { map, mapM_, forM, filter, foldl1, seq };
