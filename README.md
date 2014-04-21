Basilisk
========

Basilisk is a library for programming with **values** in Javascript.  A value is immutable - it
does not change - though it is easy to generate new values from old ones.

For example:

```javascript
var Address = basilisk.makestruct(['name', 'line1''country']),
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

Updates
-------

As your application's data becomes more complex, a simple ```with_()``` will not be enough to
update a value deep in a tree of data.  To help with that, Basilisk has an API for updating objects
deep in a tree.

```javascript

```

References
==========

Basilisk is heavily inspired by Rich Hickey's talks.

- [Value, State Identity](http://www.infoq.com/presentations/Value-Identity-State-Rich-Hickey) - Rich Hickey
- [Simple made easy](http://www.infoq.com/presentations/Simple-Made-Easy) - Rich Hickey

