/**
 * The Q module handles 'update' queries on basilisk datasets.
 */

/// <reference path="../d.ts/DefinitelyTyped/jasmine/jasmine.d.ts"/>

import basilisk = require('../src/basilisk');

import q = basilisk.q;

// We have a 'simple' set of objects here, to show how you can descend deeply into an object
// tree and update it, using the Struct module.
//
// It is modelled on a shopping cart, with items you can buy and a shipping destination.

var Address = basilisk.makestruct(['line1', 'line2', 'line3']);
var Simple = basilisk.makestruct(['a', 'b']);

describe("Query module (Q)", function () {
    describe("Simple swap function.", function () {
        it("If provided an empty path, it should apply the swap function to the specific object.", function () {
            var eg1 = new Address({ line1: 'l 1', line2: 'l 2', line3: 'l 3' }),
                calls = 0;

            basilisk.q.swap(eg1, [], function (obj:any) {
                expect(obj).toBe(eg1);
                calls += 1;
            });
            expect(calls).toBe(1);
        });

        it("If provided with a path to a single string, to should apply the swap to that property of the root.", function () {
            var eg1 = new Address({ line1: 'l 1', line2: 'l 2', line3: 'l 3' }),
                calls = 0,
                result;

            result = basilisk.q.swap(eg1, ['line1'], function (obj:any) {
                expect(obj).toBe(eg1.line1);
                calls += 1;
                return 'changed';
            });
            expect(calls).toBe(1);

            expect(result).not.toBe(eg1);
            expect(result.line1).toBe('changed');
            expect(result.line2).toBe(eg1.line2);
            expect(result.line3).toBe(eg1.line3);
        });

        it("Should allow you to descend a number of steps.", function () {
            var eg1 = new Address({ line1: 'l 1', line2: 'l 2',
                    line3: new Address({ line2: 'sample' })
                }),
                calls = 0,
                result;

            result = basilisk.q.swap(eg1, ['line3', 'line2'], function (obj:any) {
                expect(obj).toBe(eg1.line3.line2);
                calls += 1;
                return 'changed';
            });
            expect(calls).toBe(1);

            expect(result).not.toBe(eg1);
            expect(result.line3.line2).toBe('changed');
        });
    });

    describe("at swapper", function () {
        it("Should do a numeric key check for a vector.", function () {
            var base = new basilisk.Vector<number>([2, 4, 6]),
                calls = 0,
                result;

            result = q.swap(base, [q.at(1)], (val) => {
                calls += 1;
                expect(val).toBe(4);
                return val * 2;
            });

            expect(calls).toBe(1);
            expect(result.equals(new basilisk.Vector([2, 8, 6]))).toBe(true);
        });

        it("Should be possible to mix vectors and objects.", function () {
            var base = new Simple({
                'a': 'hello',
                'b': new basilisk.Vector<any>([
                    new Simple({ a: 'index0a', b: 'index0b'}),
                    new Simple({ a: 'index1a', b: 'index1b'})
                ])
            }),
                result;

            result = q.swap(base, ['b', q.at(1), 'a'], (value) => {
                return 'changed';
            });

            expect(base).not.toBe(result);
            expect(result.b.get(1).a).toBe('changed');
        });
    });
});
