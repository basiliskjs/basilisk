"use strict";

var Benchmark = Benchmark || require('benchmark');
var basilisk = basilisk || require('../dist/basilisk.commonjs');

var suite = new Benchmark.Suite();

var h = basilisk.HashMap.from(function (x) { return x; });

for (var i=13; i < 1000; i++) {
    h = h.set(i, i);
}

suite.add('HashMap#set', function () {
    i += 1;
    h.set(i % 1000, i);
})
.on('cycle', function(event) {
    console.log(String(event.target));
});

suite.run({ async: true });