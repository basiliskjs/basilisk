/**
 * Test the behaviour of the collections module.
 */

/*global module, test, equal, ok, strictEqual, notEqual, notStrictEqual, _*/

(function () {
    "use strict";
    
    var b = basilisk,
        c = basilisk.collections;

    module("basilisk.collections.list");

    test("Basic shift/unshift", function () {
        var list = new c.ForwardList(), 
            shifted;

        equal(list.length(), 0, "List should start off at 0.");

        list = list.shift('hello');

        equal(list.length(), 1, "After shifting, length should be 1.");        
        strictEqual(list.head.value, 'hello', 'And head should contain the specified value.');

        list = list.shift('world');

        equal(list.length(), 2, "After shifting, we length should increase.");
        strictEqual(list.head.value, 'world', 'And head should contain the specified value.');        

        shifted = list.unshift();

        list = shifted[1];
        equal(shifted[0], 'world', 'unshifting should remove the last value');
        strictEqual(list.head.rest, undefined, 'and the list should be back to its old state');
        strictEqual(list.length(), 1, 'and the list should have only one element in it.');
    });

    test("simple iteration", function () {
        var list = new c.ForwardList(),
            lastIdx, lastValue, indexes = [];

        list = list.shift('c');
        list = list.shift('b');
        list = list.shift('a');

        expect(15);
        equal(list.length(), 3, 'Expecting a 3 item list');

        ok(_.isFunction(list.each), 'List has an each method');

        list.each(function (value, idx, iterList, node) {
            notStrictEqual(idx, lastIdx, 'Must progres through the list.');
            notStrictEqual(value, lastValue, 'Must progres through the list.');

            strictEqual(node.value, value, "Value must match node.");
            strictEqual(iterList, list, 'Should tell the iterator which list is being iterated');

            lastValue = value;
            lastIdx = idx;
            indexes.push(idx);
        });

        ok(_.isEqual(indexes, [0,1,2]), 'Indexes should run in order.');
    });

})();