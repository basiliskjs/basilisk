/**
 * Test the behaviour of the atom construct.
 */

/*global module, test, equal, ok, strictEqual, notEqual, notStrictEqual, _*/

(function () {
    module('basilisk.Atom');

    test('Swap should call function with initial behaviour.', function () {
        var o1 = { x: 123, y: 321 },
            o2 = { x: 12,  y: 32},
            atom = new basilisk.Atom(o1);

        expect(5);

        strictEqual(atom.deref(), o1);

        atom.swap(function (current) {
            var future = o2;

            strictEqual(current, o1, 'previous value should be passed into change function');

            return future;
        });

        strictEqual(atom.deref(), o2);

        // the second time round, the handler function should be called with the "future" value
        atom.swap(function (current) {
            var future = o1;

            strictEqual(current, o2, 'updated value should be passed in the second time round.');

            return future;
        });

        strictEqual(atom.deref(), o1);
    });

    test('atom.compareAndSet should check functions.', function () {
        var o1 = {},
            o2 = {},
            o3 = {},
            atom = new basilisk.Atom(o1);

        strictEqual(atom.cas, atom.compareAndSet, "CAS is a direct alias of compareAndSet");

        strictEqual(atom.deref(), o1, "Initial value is o1");

        ok(atom.cas(o1, o2), 'cas with initial value should successfully update');

        strictEqual(atom.deref(), o2, "Modified value should stay, if cas reports success");

        ok(!atom.cas(o1, o3), 'Should not claim to swap value if not using current value.');

        notStrictEqual(atom.deref(), o3, 'Should not have swapped the base value.');
    });

    test('atom validation function', function () {
        var o1 = {},
            o2 = {},
            o3 = {},
            atom;

        expect(9);

        // the validator takes the new and old values (in that order) and returns
        // a boolean (or other value with truthiness)  
        atom = new basilisk.Atom(o1, function (newVal, oldVal) {
            strictEqual(newVal, o1, "Setup should immediately be caled with the initial value.");
            ok(oldVal === undefined, 'At setup, the oldval should be undefined');
            return true;
        });

        atom = new basilisk.Atom(o1, function (newVal, oldVal) {
            // skip validation on first run.
            if (newVal === undefined) { return false; }
            if (oldVal === undefined) { return true; }

            // this should be run when the swap is run.
            strictEqual(newVal, o2);
            return true;
        });

        ok(atom.swap(function () { return o2; }));

        strictEqual(atom.deref(), o2);

        // check that the validator's pattern is applied
        atom = new basilisk.Atom(o1, function (newVal, oldVal) { return newVal !== o2; });

        raises(function () { atom.swap(function () { return o2; })}, "Value does not pass validator.");

        strictEqual(atom.deref(), o1, 'must not change if validator returns false.');

        ok(atom.swap(function () { return o3; }));

        strictEqual(atom.deref(), o3, 'can swap if value is changed');
    });

test('atom watcher should be called for valid, changing events', function () {
    var o1 = {},
        o2 = {},
        o3 = {},
        atom;

    atom = new basilisk.Atom(o1);

    expect(4);

    // we expect to be called with the newVal and the oldVal, including on setup.
    atom.addWatcher(function (newVal, oldVal) {
        strictEqual(newVal, o2, 'newval must be passed in');
        strictEqual(oldVal, o1, 'pre-change value must also be provided');
    });

    atom.swap(function () { return o2; });

    // we should NOT be called now.

    atom.swap(function () { return o2; });

    atom = new basilisk.Atom(o1, function (newVal, oldVal) { return newVal !== o3; });
    atom.addWatcher(function () { ok(false, 'should not be called if validator fails.'); } );
    raises(function () { atom.swap(function () { return o3; }); });

    strictEqual(atom.deref(), o1, 'Must not have changed the initial value');
});

})();