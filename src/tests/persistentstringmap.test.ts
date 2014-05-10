/// <reference path="../../d.ts/DefinitelyTyped/jasmine/jasmine.d.ts"/>

import basilisk = require('../basilisk');

import SM = basilisk.hamt.PersistentStringMap;

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
    });
});
