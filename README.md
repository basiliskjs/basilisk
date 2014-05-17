Basilisk
========

Basilisk is a library for programming with **values** in Javascript.  A value is immutable - it
does not change - though it is easy to generate new values from old ones.

For example:

```javascript
var Address = basilisk.makeStruct(['name', 'line1''country']),
    myAddress = new Address({ name: 'Brad Shuttleworth', 'country': 'UK' }),
    changedAddress = myAddress.with_('line1', 'London');

console.log('with_ does not change the original value: ', myAddress, changedAddress);

// with_ is designed to try to maintain equality as often as possible:

changedAddress = myAddress.with_('name', 'Brad Shuttleworth');

console.log('after a non-change, equality is ', myAddress === changedAddress);
```

When programming with values, ```===``` becomes extremely powerful: if two values are ===, then
no changes can have occurred to any part of it, no matter how deep in the value the change may have
been.  This means that many cache or update operations can be short-circuited to an incredibly
efficient === operation.

Basilisk structs and datastructures also support a ```.equals()``` method which does a deeper check
of each property, which caters for the situation where two equal objects have been created without
them being created from the same source.

Datastructures
--------------

Basilisk has decent implementations of Vectors and Maps.  This means that updating or changing 
large datastructures (+- 10,000 elements) should be reasonably performant - patches to improve 
performance are welcome.  All these datastructures are persistent, meaning that 'change' methods
actually return new objects which share as much state with the old versions.

Updates
-------

As your application's data becomes more complex, a simple ```with_()``` will not be enough to
update a value deep in a tree of data.  To help with that, Basilisk has an API for updating objects
deep in a tree.

```javascript


var b$ = basilisk.query;

// Given some deeply nested structure called 'store'
// where store.a.path.to.a.property is a property deep in the structure
// this will create a new value from that structure with a value replaced.

// Prints the initial value, followed by 10.
console.log('Given an initial value of', store.a.path.deep.inside);
store = b$.replace(store, ['a', 'path', 'deep', 'inside'], 10);
console.log('We end up with', store.a.path.deep.inside);

// There is a more general method, 'swap', which applies a function to the value
// and uses the return value as the new version.

// Will print 17
store = b$.swap(store, ['a', 'path', 'deep', 'inside'],
   function (initial) { return initial + 7; });
console.log('Swap gives us', store.a.path.deep.inside);

// These methods can also be used with datastructures, using the 'at'
// helper.

store = b$.replace(store, ['a', 'keyed', b$.at('chain'), 'works', 'too'], 12);

// b$ works with any value datastructure which supports a .get and .set method.
```

Plain-old-javascript
--------------------

Basilisk is designed to look and work as expected from 'normal' javascript code:  the method
and property names should be similar to that of the standard library, but with immutable
(persistent) results.

Using a Vector is a good example.  

```javascript

var vect = basilisk.Vector.from(['a', 'b', 'c', 'd', 'e']),
    changed = vect.push('f');

console.log(vect.length); // === 5
console.log(changed.length); // === 6

console.log(vect.get(1)); // returns 'b'
console.log(vect.get(-1)); // returns 'e'
```

StringMaps also handle a number of cases that can be annoying in simple javascript:

```javascript

var dict = basilisk.StringMap.from({ 'hello': 'world' });

console.log(dict.get('hello'));  // returns 'world'
console.log(dict.get('cat', 'on a mat'));  // returns 'on a mat'

dict = dict.set('__proto__', 'this is safe');

console.log(dict.get('__proto__')); // returns 'this is safe'. 

```

References
==========

Basilisk is heavily inspired by Rich Hickey's talks.

- [Value, State Identity](http://www.infoq.com/presentations/Value-Identity-State-Rich-Hickey) - Rich Hickey
- [Simple made easy](http://www.infoq.com/presentations/Simple-Made-Easy) - Rich Hickey

