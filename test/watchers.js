/**
 * Test the behaviour of the definition module.
 */

/*global module, test, equal, ok, strictEqual, notEqual, notStrictEqual, _*/

(function () {
    "use strict";
    
    var b = basilisk;

    module("basilisk.watchers");

    test('Simple paths', function () {
        // for a simple path example, we define a simple binary tree.
        var Node = b.definitions.makeConstructor({
            l: {},
            r: {},
            label: {}
        }), root1, root2, watcher;

        root1 = new Node({
            label: 'Root',
            l: new Node({
                label: 'l',
                l: undefined,
                r: new Node({
                    label: 'l.r'
                })
            }),
            r: new Node({
                label: 'r'
            })
        });

        root2 = root1.withR(new Node({ label: 'changedR' }));

        expect(4);
        // We create the watcher, and pass root2 as the updated version, compared to root1.
        // This should indicate that the right node was changed.
        watcher = basilisk.watchers.path('r', function (newVal, oldVal) {
            strictEqual(newVal, root2.r);
            strictEqual(oldVal, root1.r);
        });

        watcher(root2, root1);

        watcher = basilisk.watchers.path('r.label', function (newVal, oldVal) {
            strictEqual(newVal, root2.r.label, 'descent should work at multiple levels');
            strictEqual(oldVal, root1.r.label, 'descent should work at multiple levels');
        });

        watcher(root2, root1);
    });

    test('No calling if no changes', function () {
        // for a simple path example, we define a simple binary tree.
        var Node = b.definitions.makeConstructor({
            l: {},
            r: {},
            label: {}
        }), root1, root2, watcher;

        root1 = new Node({
            label: 'Root',
            l: new Node({
                label: 'l',
                l: undefined,
                r: new Node({
                    label: 'l.r'
                })
            }),
            r: new Node({
                label: 'r'
            })
        });

        expect(0);
        // We create the watcher, and pass root2 as the updated version, compared to root1.
        // This should indicate that the right node was changed.
        watcher = b.watchers.path('l.r', function (newVal, oldVal) {
            ok(false, 'should not find a difference where these is none');
        });

        watcher(root1, root1);
    });

    test('See a change if one path is undefined (without failing!)', function () {
        // for a simple path example, we define a simple binary tree.
        var Node = b.definitions.makeConstructor({
            l: {},
            r: {},
            label: {}
        }), root1, root2, watcher;

        root1 = new Node({
            label: 'Root',
            l: new Node({
                label: 'l',
                l: undefined,
                r: new Node({
                    label: 'l.r'
                })
            }),
            r: new Node({
                label: 'r'
            })
        });

        expect(2);
        // We create the watcher, and pass root2 as the updated version, compared to root1.
        // This should indicate that the right node was changed.
        watcher = b.watchers.path('l.r', function (newVal, oldVal) {
            strictEqual(newVal, root1.l.r, 'Since the newval *has* the path, it should be reported');
            ok(_.isUndefined(oldVal), 'oldval was null, and there was a path, so should see undefined in watcher.');
        });

        watcher(root1, undefined);
    });
})();