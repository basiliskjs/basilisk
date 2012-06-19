/**
 * Test the behaviour of the definition module.
 */

/*global module, test, equal, ok, strictEqual, notEqual, notStrictEqual, _*/

(function () {
    "use strict";
    
    var b = basilisk,
        properStrict = false,
        eg;


    try {
        eg = {};
        Object.defineProperty(eg, 'x', {value: 13, writable: false});
        try {
            eg.x = 14;
        } catch (e2) {
            properStrict = true;
        }
    } catch (e) {
        properStrict = false;
    }

    if (window && window.console && window.console.log) {
        console.log("Running in proper strict? ", properStrict);
    }

    // actual tests.
    module('basilisk.Definitions');
    test('makeConstructor should return a function.', function () {
       var eg, Cons = b.definitions.makeConstructor({
            x: {},
       });

       ok(_.isFunction(Cons), 'Constructor should be a function.');

       eg = new Cons({});
       ok(eg instanceof Cons, 'Constructor function should return a new instance of the property.');
    });

    test('constructor output should have all the properties from the source.', function () {
        var eg, Cons = b.definitions.makeConstructor({
            x: {},
            y: {}
        });

        eg = new Cons({});

        ok(_.has(eg, 'x'), 'Should have x');
        ok(_.has(eg, 'y'), 'Should have y');

        eg = new Cons({
            c: 'asdcasdc'
        });

        ok(!_.has(eg, 'c', 'Should only contain properties that are actually supplied.'));
    });

    test('constructor should use strict object copying', function () {
        var eg, 
            ref = {
            x: {},
            y: {}
        }, Cons = b.definitions.makeConstructor({
            x: {},
            y: {}
        });

        eg = new Cons(ref);

        strictEqual(eg.x, ref.x, 'Strict copy of x');
        strictEqual(eg.y, ref.y, 'Strict copy of y');
    });

    test('Basic "withX" function', function () {
        var eg1, eg2, Cons = b.definitions.makeConstructor({
            x: {},
            y: {}
        });

        eg1 = new Cons({
            x: 12,
            y: {}
        });

        equal(eg1.x, 12, 'Initial copy occurred correctly.');
        eg2 = eg1.withX(13);

        strictEqual(eg1.y, eg2.y, 'Y value not changed, should be identical');

        notStrictEqual(eg2.x, eg1.y, 'x value MUST have changed');
        strictEqual(eg2.x, 13, 'Value should be set to provided value.');
    });

    test('with functions and references', function () {
        var change1 = {},   // these will have different identifies.
            change2 = {},
            Cons = b.definitions.makeConstructor({
                x: {}
            }),
            eg1, eg2;

        eg1 = new Cons({
            x: change1
        });

        notStrictEqual(change1, change2, 'Browser must not treat different references as strictly equal');
        strictEqual(eg1.x, change1, 'references should initialise cleanly');
        eg2 = eg1.withX(change2);
        strictEqual(eg2.x, change2, 'references should be brought in via withX cleanly');
    });

    // Test that value functions are properly used.

    test('value function application', function () {
        // filter function must be idempotent: this one converts the object to the target format.
        var YCons = b.definitions.makeConstructor({
            y: {}
        }),
            XCons = b.definitions.makeConstructor({
            x: { filter: function (value) { 
                if (value instanceof YCons) {
                    return value;
                } else {
                    return new YCons(value);
                }
            }}
        }), eg1, eg2, eg3;

        eg1 = new YCons({ y: 3 });
        eg2 = new XCons({ x: eg1 });

        strictEqual(eg2.x, eg1, 'Items should pass through without change in the default case');

        eg2 = new XCons({ x: { y: 4 } });
        notStrictEqual(eg2.x, eg1, 'But not via identity mapping.');
        strictEqual(eg2.x.y, 4, 'Should still bring items in');
        ok(eg2.x instanceof YCons, 'Filter function result should be passed through.');
    });

    test('with_ makes no change if property is identical', function () {
        var Cons = b.definitions.makeConstructor({
            x: {}
        }), eg1, eg2, common = {};

        eg1 = new Cons({
            x: common
        });
        eg2 = eg1.withX(common);

        strictEqual(eg2, eg1, 'If there is no change, apply no change.');
    });

    test('with_ honours strictEqual function', function () {
        var Cons = b.definitions.makeConstructor({
            x: { strictEqual: function (a, b) { return a > b } }
        }), eg1, eg2;

        eg1 = new Cons({
            x: 3
        });
        
        eg2 = eg1.withX(5);

        strictEqual(eg2, eg1, 'No change according to comparison function.');

        eg2 = eg1.withX(1);

        notStrictEqual(eg2, eg1, 'Changed according to function.');
    });

    // we have slightly different tests for ES5 compliant versions, and non-ES5 compliant versions.
    if (properStrict) {
        module('ES5 Strict, basilisk.definitions');

        test('property settings should result in error.', function () {
            var Cons = b.definitions.makeConstructor({
                x: {},
            }), eg;

            eg = new Cons({ x: 13 });
            raises(function () {
                eg.x = 14;
            });
        })
    } else {
        module('Fallback (non-strict), basilisk.definitions');

        test('Even if a property is mangled, "with" should create a clean copy.', function () {
            var Cons = b.definitions.makeConstructor({
                y: {},
            }), eg;

            eg = new Cons({ y: 10 });
            eg.y = 11;
            equal(11, eg.y, "in non-strict mode, changing properties does (sadly) work");
            eg = eg.with_({});
            equal(10, eg.y, 'but with_ will restore the original value.');
        });
    }

})();