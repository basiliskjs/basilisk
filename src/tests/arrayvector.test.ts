/// <reference path="../../d.ts/DefinitelyTyped/jasmine/jasmine.d.ts"/>

import basilisk = require('../basilisk');

// we use this a *lot*, so simplify it here.
import V = basilisk.ArrayVector;

class Sample extends basilisk.ts.Struct {
    constructor(opts:{ name:string }) {
        this.name = opts.name;
        super();
    }

    public name:string;
}

function vectorOfThree():V<Sample> {
    var a = new Sample({ name: "a" }),
        b = new Sample({ name: "b" }),
        c = new Sample({ name: "c" });

    return V.from<Sample>([a, b, c]);
}

describe("ArrayVector", function () {
    describe(".from", function () {
        it("Can be instantiated with a simple array, and has correct length.", function () {
            var sample:V<Sample> = vectorOfThree();
            expect(sample.length).toBe(3);
        });

        it("Contains all items added to it initially.", function  () {
            var sample = vectorOfThree();

            expect(sample.get(0)).toEqual(jasmine.objectContaining({ name: 'a' }));
            expect(sample.get(1)).toEqual(jasmine.objectContaining({ name: 'b' }));
            expect(sample.get(2)).toEqual(jasmine.objectContaining({ name: 'c' }));
        });

        it("Can be extended using append", function () {
            var sample = vectorOfThree(),
                extended = sample.append(new Sample({ name: 'd' }));

            expect(sample).not.toBe(extended);
            expect(sample.length).toBe(3);
            expect(extended.length).toBe(4);
            expect(extended.get(3)).toEqual(jasmine.objectContaining({ name: 'd' }));
        });

        it("Can be created from another vector.", function () {
            var sample = vectorOfThree(),
                created = V.from(sample);

            expect(created.get(0)).toEqual(jasmine.objectContaining({ name: 'a' }));
            expect(created.get(1)).toEqual(jasmine.objectContaining({ name: 'b' }));
            expect(created.get(2)).toEqual(jasmine.objectContaining({ name: 'c' }));
            expect(created.get(2).name).toEqual('c');
        });

        it("Can be created empty.", function () {
            var sample = V.from([]);

            expect(sample.length).toBe(0);
        });
    });

    describe(".forEach", function () {
        it("Can be iterated with forEach", function () {
            var sample = vectorOfThree(),
                count = 0,
                last = -1,
                seen = {};

            sample.forEach(function (v:Sample, i:number) {
                expect(seen[v.name]).toBeUndefined();
                seen[v.name] = true;
                count = count + 1;
                expect(i - last).toBe(1);
                last = i;
            });

            expect(count).toBe(sample.length);
            expect(seen['a']).toBeTruthy();
            expect(seen['b']).toBeTruthy();
            expect(seen['c']).toBeTruthy();
        });

    });

    describe(".set", function () {
        it("Can have a particular item replaced.", function () {
            var sample = vectorOfThree(),
                result = sample.set(1, new Sample({ name: "d" }));

            expect(sample).not.toBe(result);
            expect(result.length).toBe(3);
            expect(result.get(0)).toEqual(jasmine.objectContaining({ name: 'a' }));
            expect(result.get(1)).toEqual(jasmine.objectContaining({ name: 'd' }));
            expect(result.get(2)).toEqual(jasmine.objectContaining({ name: 'c' }));

            expect(sample.get(1)).toEqual(jasmine.objectContaining({ name: 'b' }));
        });

        it("Strictly identical replace is an identity function.", function () {
            var sample = vectorOfThree(),
                result = sample.set(1, sample.get(1));

            expect(sample).toBe(result);
        });
    });

    describe(".filter", function () {
        it("Only items for which we return true will be included in the filter. ", function () {
            var sample = vectorOfThree(),
                callCount = 0;
            var filterFn = function (value:Sample): boolean {
                    callCount += 1;
                    return !(callCount > 1);
                };
            var result = V.from(sample.filter(filterFn));

            expect(callCount).toBe(sample.length);
            expect(result.length).toBe(1);
            expect(result.get(0)).toBe(sample.get(0));
        });

        // TODO test correct order of calls.
        // TODO test all items called for
        // TODO test that later items are correctly removed.
    });

    describe(".find", function () {
        it("Should be able to call find with a search function.", function () {
            var sample = vectorOfThree(),
                callCount = 0;
            var searchFn = function (value:Sample, index:number): boolean {
                return (index === 1);
            };
            var result = sample.find(searchFn);

            expect(result).toBe(sample.get(1));
        });

        // TODO test complete coverage
        // TODO test search
    });

    describe('.splice', function() {

        it("Should return the original vector if no items required to be added or removed", function() {
            var small = V.from(['one', 'two', 'three', 'four']),
                result = small.splice(1, 0);

            expect(result.spliced).toEqual(small);
            expect(result.removed.length).toEqual(0);
        });

        it("Should remove items from the middle of a vector", function() {
            var small = V.from(['one', 'two', 'three', 'four']),
                result = small.splice(1, 2);

            expect(result.spliced.length).toBe(2);
            expect(result.removed.length).toBe(2);
            expect(result.spliced.get(1)).toBe('four');
        });

        it("Should add items to the middle of a vector", function() {
            var small = V.from(['one', 'two', 'three', 'four']),
                result = small.splice(1, 0, 'one and a half', 'one and threequarters');

            expect(result.spliced.length).toBe(6);
            expect(result.removed.length).toBe(0);
            expect(result.spliced.get(1)).toBe('one and a half');
            expect(result.spliced.get(2)).toBe('one and threequarters');
            expect(result.spliced.get(5)).toBe('four');
        });
    });
//
//    describe(".map", function () {
//        it("Should be able to call find with a search function.", function () {
//            var sample = vectorOfThree(),
//                callCount = 0;
//            var mapFn = function (value:Sample, index:number): Sample {
//                return <Sample> value.with_('name', value.name + '-');
//            };
//            var result = sample.map(mapFn);
//
//            expect(result.length).toBe(sample.length);
//
//            result.forEach(function (val:Sample, index:number) {
//                expect(val.name).toBe(sample.get(index).name + '-');
//            });
//        });
//    });
});

