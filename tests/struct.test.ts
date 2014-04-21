/**
 * Test that the Struct code works correctly.
 */

/// <reference path="../d.ts/DefinitelyTyped/jasmine/jasmine.d.ts"/>

import basilisk = require('../src/basilisk');

class Sample extends basilisk.ts.Struct {
    constructor(opts:{ a:Number }) {
        this.a = opts.a || 0.0;
        super();
    }

    public a:Number;

    // we need to declare the different ways that "with_" can be used, so as to
    // allow Typescript to properly hint our functions.

    public with_(propName:string, propValue:any):Sample { return <Sample> super.with_(propName, propValue); }
}

describe("Struct suite", function () {
    it("Can be subclassed via typescript.", function () {
        var z = new Sample({ a: 5 });
    });

    it("Has a with method, which replaces at least some items", function  () {
        var eg1 = new Sample({ a: 5 }),
            eg2:Sample = eg1.with_('a', 6);

        expect(eg1.a).toBe(5);
        expect(eg2.a).toBe(6);
    })
});

describe("makestruct suite", function () {
    describe("Constructor", function () {
        var Sample = basilisk.makestruct(['a', 'b']);

        it("Will create a constructor function from a simple set of properties", function () {
            var eg1 = new Sample({ a: 'check a', b: 'check b'});

            expect(eg1.a).toBe('check a');
            expect(eg1.b).toBe('check b');
        });

        it("Will fail if __proto__ is included.", function () {
            expect(function () {
                var s = basilisk.makestruct(['__proto__']);
            }).toThrow();
        });

        it("Will fail if with_ is included.", function () {
            expect(function () {
                var s = basilisk.makestruct(['with_']);
            }).toThrow();
        });

        it("Will not fail if equals is included, and includeEquals is true", function () {
            expect(function () {
                var s = basilisk.makestruct(['equals'], true);
            }).toThrow();
        });


        it("Will not fail if equals is included, and includeEquals is false", function () {
            expect(function () {
                var s = basilisk.makestruct(['equals'], false);
            }).not.toThrow();
        });
    });

    describe("with_ method", function () {
        var Sample = basilisk.makestruct(['a', 'b']);

        it("Should return a version of the object with only the named parameter changed.", function () {
            var eg1 = new Sample({ a: 'check a', b: 'check b'}),
                eg2 = eg1.with_('a', 'changed');

            expect(eg1.a).toBe('check a');
            expect(eg1.b).toBe('check b');
            expect(eg2.b).toBe(eg1.b);
            expect(eg2.a).toBe('changed');
        });

        it("Should return the original value, if the property is unchanged.", function () {
            var eg1 = new Sample({ a: 'check a', b: 'check b'}),
                eg2 = eg1.with_('a', 'check a');

            expect(eg1).toBe(eg2);
        });

        it("Changing a non-named property should have no effect.", function () {
            var eg1 = new Sample({ a: 'check a', b: 'check b'}),
                eg2 = eg1.with_('with_', 'changed');

            expect(eg2.with_).toBe(eg1.with_);
            eg2 = eg1.with_('__proto__', {});
            expect(eg2).toBe(eg1);
        });
    });
});

