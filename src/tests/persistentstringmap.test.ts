/// <reference path="../../d.ts/DefinitelyTyped/jasmine/jasmine.d.ts"/>

import basilisk = require('../basilisk');

import SM = basilisk.StringMap;

var freeze = (obj:any):any => { return (Object.freeze) ? Object.freeze(obj) : obj; };

describe('PersistentStringMap', function () {
    describe('.from', function () {
        it("Should not contain elements when empty.", function () {
            var MARKER = {},
                example = SM.from(null);

            expect(example.get('hello', MARKER)).toBe(MARKER);
            expect(example.get('a', MARKER)).toBe(MARKER);
            expect(example.get('b', MARKER)).toBe(MARKER);
            expect(example.get('c', MARKER)).toBe(MARKER);
            expect(example.get('d', MARKER)).toBe(MARKER);
            expect(example.get('_____', MARKER)).toBe(MARKER);
            expect(example.get('__proto__', MARKER)).toBe(MARKER);
        });

        it("Should contain any properties set in the initial hash.", function () {
            var example = SM.from({ 'a': 'hello', 'b': 'other' });

            expect(example.get('a')).toBe('hello');
            expect(example.get('b')).toBe('other');
        });

        it("Must be safe to use with 'dangerous' keys.", function () {
            var example = SM.from({ 'a': 'hello', 'b': 'other' }).set('__proto__', 'check');

            expect(example.get('a')).toBe('hello');
            expect(example.get('__proto__')).toBe('check');
        });

        it("Must be possible to check equality.", function () {
            var eg1 = SM.from({'a': 'b'}),
                eg2 = SM.from({'a': 'b'});

            expect(basilisk.equals(eg1, eg2)).toBe(true);
        });

        it("Must be possible for equality to fail.", function () {
            var eg1 = SM.from({'a': 'b'}),
                eg2 = SM.from({'a': 'c'});

            expect(basilisk.equals(eg1, eg2)).toBe(false);
        });

        it("Subset order should not matter..", function () {
            var eg1 = SM.from({'a': 'b'}),
                eg2 = SM.from({'a': 'b', 'c': 'd'});

            expect(basilisk.equals(eg1, eg2)).toBe(basilisk.equals(eg2, eg1));
            expect(basilisk.equals(eg1, eg2)).toBe(false);
        });

        it("Can remove items from map", function () {
            var example = SM.from({ a: 'hello', b: 'world'}),
                actual = example.remove('a');

            expect(actual.get('a')).toBeUndefined();
            expect(actual.get('b')).toBe('world');
        });
    });
});
