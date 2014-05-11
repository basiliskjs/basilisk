"use strict";

var Benchmark = Benchmark || require('benchmark');
var basilisk = basilisk || require('../dist/basilisk.commonjs');

var suite = new Benchmark.Suite();

var vect = basilisk.Vector.from([]);

for (var i=13; i < 1000; i++) {
    vect = vect.push(i);
}

suite.add('Vector#push', function () {
    i += 1;
    vect.push(i);
})
.on('cycle', function(event) {
    console.log(String(event.target));
});

suite.run({ async: true });