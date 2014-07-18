Basilisk is a **value** library for Javascript.  It allows you to create
**immutable** data in a familiar way, and to **derive new versions** from that
data.

Full documentation is [available on readthedocs](http://basilisk.readthedocs.org/)


```javascript

var Person = basilisk.makeStruct(['name', 'age']),
    example = new Person({ name: 'Joe', age: 32 }),
    older = example.with_('age', example.age + 2);
```

Making code which updates deeply nested structures **simple** and **clear** 
is the library's main aim.

```javascript    
// we make a quick alias, to reduce clutter in the code.
var b$ = basilisk.query,

    Person = basilisk.makeStruct(['name', 'age', 'addresses']),
    Address = basilisk.makeStruct(['city', 'country']),

    example = new Person({
        name: 'Joe',
        age: 32, 

        addresses = basilisk.Vector.from([
            new Address({ city: 'London', country: 'United Kingdom' }),
            new Address({ city: 'Cape Town', country: 'South Africa' })
        ])
    }),
    example2, example3;

// first we create a new object, with a US address added.

example2 = b$.swap(example, ['addresses'], function (current) {
    return current.push(new Address({ city: 'Boston', country: 'USA' }));
});

// and if we have to replace a part of that new address.

example3 = b$.replace(example2, ['addresses', b$.at(2), 'city'], 'New York');
```


What's included
===============

* Structs with new-version helpers.
* Persistent data structures (Vector, HashMap, StringMap) with a Javascript flavor.
* A Query/Update utility to make deep changes in a data store easy to understand. 

Examples
========

There is a simple example application called [Listicle](https://github.com/basiliskjs/listicle).
 
Documentation
=============

Read all about it on [readthedocs](http://basilisk.readthedocs.org/en/latest/).

Installing Basilisk
===================

Note that you need to have an ES5 Shim in place to use Basilisk on older browsers.

* Bower: ``bower install basilisk``
* Node: ``npm install basilisk``

Contributions
=============

Contributions are very welcome!  Basilisk is MIT Licensed, so you can use 
Basilisk in your applications without worry.

Inspired by
===========

Basilisk is heavily inspired by Rich Hickey's talks.

- [Value, State Identity](http://www.infoq.com/presentations/Value-Identity-State-Rich-Hickey) - Rich Hickey
- [Simple made easy](http://www.infoq.com/presentations/Simple-Made-Easy) - Rich Hickey

