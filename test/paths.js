/**
 * Test the behaviour of Paths
 */

/*global module, test, equal, ok, strictEqual, notEqual, notStrictEqual, _*/

(function () {
    "use strict";
    module('basilisk.Path');

    var b = basilisk, Path = b.utils.Path;

    test('Basic path descent', function () {
        var Struct = b.struct({
            left: {}, right: {},
            value: {}
        }), eg1;

        eg1 = new Struct({
            value: '',
            left: new Struct({
                value: 'l',
                right: new Struct({
                    value: 'l.r'
                })
            })
        });

        equal('l', new Path('left').consume(eg1).value, 'Single step path should return the immediate node');
        equal('l.r', new Path('left.right').consume(eg1).value, 'Single step path should return the immediate node');
    });

    test('Deep value setting', function () {
        var Struct = b.struct({
            left: {}, right: {},
            value: {}
        }), eg1, eg2;

        eg1 = new Struct({
            value: '',
            left: new Struct({
                value: 'l',
                right: new Struct({
                    value: 'l.r'
                })
            })
        });

        eg2 = new Path('right').replace(eg1, new Struct({ value: 'new' }));

        equal(eg2.right.value, 'new', 'replaced value should be at the property we expect');
        strictEqual(eg2.left, eg1.left, 'Properties that are not mentioned should be identical');
    });

})();