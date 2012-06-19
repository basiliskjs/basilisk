/**
 * Test the behaviour of Paths
 */

/*global module, test, equal, ok, strictEqual, notEqual, notStrictEqual, _*/

(function () {
    "use strict";
    module('basilisk.Path');

    var b = basilisk, Path = b.utils.Path;

    test('Basic path descent', function () {
        var TreeNode = b.struct({
            left: {}, right: {},
            value: {}
        }), eg1;

        eg1 = new TreeNode({
            value: '',
            left: new TreeNode({
                value: 'l',
                right: new TreeNode({
                    value: 'l.r'
                })
            })
        });

        equal('l', new Path('left').consume(eg1).value, 'Single step path should return the immediate node');
        equal('l.r', new Path('left.right').consume(eg1).value, 'Single step path should return the immediate node');
    });

    test('shallow value setting', function () {
        var TreeNode = b.struct({
            left: {}, right: {},
            value: {}
        }), eg1, eg2;

        eg1 = new TreeNode({
            value: '',
            left: new TreeNode({
                value: 'l',
                right: new TreeNode({
                    value: 'l.r'
                })
            })
        });

        eg2 = new Path('right').replace(eg1, new TreeNode({ value: 'new' }));

        equal(eg2.right.value, 'new', 'replaced value should be at the property we expect');
        strictEqual(eg2.left, eg1.left, 'Properties that are not mentioned should be identical');
    });

    test('deep value setting', function () {
        var TreeNode = b.struct({
            left: {}, right: {},
            value: {}
        }), eg1, eg2;

        eg1 = new TreeNode({
            value: '',
            left: new TreeNode({
                value: 'l',
                right: new TreeNode({
                    value: 'l.r'
                }),
                left: new TreeNode({
                    value: 'l.l',
                })
            })
        });

        eg2 = new Path('left.right.left').replace(eg1, new TreeNode({ value: 'new' }));

        equal(eg2.left.right.left.value, 'new', 'replaced value should be at the property we expect');
        strictEqual(eg2.left.left, eg1.left.left, 'Properties that are not mentioned should be identical');
    });

    test('deep swap functions.', function () {
        // we should be able to use a swap function approach, rather than a "set" approach.
        var TreeNode = b.struct({
            left: {}, right: {},
            value: {}
        }), eg1, eg2, eg3;

        eg1 = new TreeNode({
            value: '',
            left: new TreeNode({
                value: 'l',
                right: new TreeNode({
                    value: 'l.r'
                }),
                left: new TreeNode({
                    value: 'l.l',
                })
            })
        });

        eg2 = new Path('left.left').swap(eg1, function (current) {
            strictEqual(current, eg1.left.left);
            return new TreeNode({ value: 'new' });
        });

        equal(eg2.left.left.value, 'new', 'Value should have been specified properly.');

        // empty nodes might behave differently.

        eg2 = new Path('right').swap(eg1, function (current) {
            strictEqual(current, undefined, 'empty property should come through as undefined');
            return new TreeNode({ value: 'bob' });
        })

        strictEqual(eg2.right.value, 'bob', 'null/undefined should be replaced');

        eg3 = new Path('right').swap(eg2, function (current) {
            return undefined;
        });

        strictEqual(eg3.right, undefined, 'replacement with an undefined value should actually apply that change');
    });
})();