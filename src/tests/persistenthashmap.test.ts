/// <reference path="../../d.ts/DefinitelyTyped/jasmine/jasmine.d.ts"/>

import basilisk = require('../basilisk');

import Hash = basilisk.HashMap;

var freeze = (obj:any):any => { return (Object.freeze) ? Object.freeze(obj) : obj; };

// given a map of strings -> numbers, return a
function fixedStringHash(values:any):(key:string) => number {
    var safe = {};
    for (var key in values) {
        if (values.hasOwnProperty(key)) {
            if (typeof values[key] !== 'number') {
                throw "Must only provide numbers as hashcodes";
            }

            safe[key] = values[key];
        }
    }
    safe = freeze(safe);
    return function (key:string):number {
        if (!safe.hasOwnProperty(key)) {
            throw "Must only check for keys which are in the provided set.";
        }

        return safe[key];
    }
}

describe('PersistentHashMap', function () {
    describe('.from', function () {
        it("Should require a function as first parameter.", function () {
            var fn = fixedStringHash({ 'a': 0, 'b': 1, 'c': 2 }),
                map = Hash.from(fn);

            expect(() => { Hash.from(null) }).toThrow();
        });
    });


    // These tests check that the *internal* behaviour is correct: the external contract is tested above.
    describe('Internal behaviour', function () {
        it("Should still be possible to retrieve correct values, even if all keys map to the same value.", function () {
            var map = Hash.from<string, string>((k:any) => { return 0; }),
                map = map.set('a', 'a').set('b', 'b').set('c', 'c');

            expect(map.get('a')).toBe('a');
            expect(map.get('b')).toBe('b');
            expect(map.get('c')).toBe('c');
        });

        it("Collisions one deep should function correctly.", function () {
            // 97 is one deep, and the top bit is 1.  This should thus generate a nested tree, with an interior node
            // in the middle and a collision node further down.
            var map = Hash.from<string, string>(fixedStringHash({'a': 1, 'b': 97, 'c': 97 }));

            map = map.set('a', 'a');
            expect(map['root'] instanceof basilisk.hamt.Leaf).toBe(true);
            map = map.set('b', 'b');
            expect(map['root'] instanceof basilisk.hamt.Interior).toBe(true);
            expect(map['root']['contents'][1] instanceof basilisk.hamt.Interior).toBe(true);

            var nested = map['root']['contents'][1];

            expect(nested['contents'][0] instanceof basilisk.hamt.Leaf).toBe(true);
            expect(nested['contents'][3] instanceof basilisk.hamt.Leaf).toBe(true);

            map = map.set('c', 'c');


            expect(map['root'] instanceof basilisk.hamt.Interior).toBe(true);
            expect(map['root']['contents'][1] instanceof basilisk.hamt.Interior).toBe(true);
            nested = map['root']['contents'][1];
            expect(nested['contents'][0] instanceof basilisk.hamt.Leaf).toBe(true);
            expect(nested['contents'][3] instanceof basilisk.hamt.Collision).toBe(true);

            expect(map.get('c')).toBe('c');
            expect(map.get('b')).toBe('b');
            expect(map.get('a')).toBe('a');

            // now unset the items.
            map = map.remove('c');

            expect(map['root'] instanceof basilisk.hamt.Interior).toBe(true);
            expect(map['root']['contents'][1] instanceof basilisk.hamt.Interior).toBe(true);
            nested = map['root']['contents'][1];
            expect(nested['contents'][0] instanceof basilisk.hamt.Leaf).toBe(true);
            expect(nested['contents'][3] instanceof basilisk.hamt.Leaf).toBe(true);

            map = map.remove('b');
            expect(map['root'] instanceof basilisk.hamt.Leaf).toBe(true);
        });

        var count:number = 5000;
        it("Adding " + count + " elements should not be prohibitive (+- 0.5s).", function () {
            var map = Hash.from<number, number>((key:number):number => { return (key >= 0) ?  key : -1 * key; });

            for (var i=0; i < count; i++) {
                map = map.set(i, i);
            }

            var final = map;
        });
    });

    describe('.size', function () {
        var count:number = 76;
        it("Should work for different keys.", function () {
            var map = Hash.from<number, number>((key:number):number => { return Math.abs(key); }),
                correct = true;

            for (var i=0; i < count; i++) {
                map = map.set(i, i);
                correct = correct && (map.size == i + 1);
            }
            expect(correct).toBe(true);
        });

        it("Should work for collisions.", function () {
            var map = Hash.from<number, number>((key:number):number => { return 0; }),
                correct = true;

            for (var i=0; i < count; i++) {
                map = map.set(i, i);
                correct = correct && (map.size == i + 1)
            }

            expect(correct).toBe(true);
        });
    });

    describe('.keys', function () {
        var count:number = 76;
        it("Should work for different keys.", function () {
            var map = Hash.from<number, number>((key:number):number => { return Math.abs(key); }),
                correct = true,
                seen = {};

            for (var i=0; i < count; i++) {
                map = map.set(i * 2, i * 4);
                seen['s' + (i * 2)] = false;
            }

            map.keys().forEach(function (key:number) {
                seen['s' + (key)] = true;
            });

            for (var k in seen) {
                if (seen.hasOwnProperty(k)) {
                    correct = correct && seen[k];
                }
            }

            expect(correct).toBe(true);
        });

        it("Should work for collisions.", function () {
            var map = Hash.from<number, number>((key:number):number => { return 0; }),
                correct = true,
                seen = {};

            for (var i=0; i < count; i++) {
                map = map.set(i * 2, i * 4);
                seen['s' + (i * 2)] = false;
            }

            map.keys().forEach(function (key:number) {
                seen['s' + (key)] = true;
            });

            for (var k in seen) {
                if (seen.hasOwnProperty(k)) {
                    correct = correct && seen[k];
                }
            }
        });
    });

    describe('.values', function () {
        var count:number = 76;
        it("Should work for different keys.", function () {
            var map = Hash.from<number, number>((key:number):number => { return Math.abs(key); }),
                correct = true,
                seen = {};

            for (var i=0; i < count; i++) {
                map = map.set(i * 2, i * 4);
                seen['s' + (i * 4)] = false;
            }

            map.values().forEach(function (key:number) {
                seen['s' + (key)] = true;
            });

            for (var k in seen) {
                if (seen.hasOwnProperty(k)) {
                    correct = correct && seen[k];
                }
            }
        });

        it("Should work for collisions.", function () {
            var map = Hash.from<number, number>((key:number):number => { return 0; }),
                correct = true,
                seen = {};

            for (var i=0; i < count; i++) {
                map = map.set(i * 2, i * 4);
                seen['s' + (i * 4)] = false;
            }

            map.values().forEach(function (key:number) {
                seen['s' + (key)] = true;
            });

            for (var k in seen) {
                if (seen.hasOwnProperty(k)) {
                    correct = correct && seen[k];
                }
            }
        });
    });
});
