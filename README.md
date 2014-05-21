Basilisk is a library for programming with **values** in Javascript.  A value is immutable - it
does not change - though it is easy to generate new values from old ones.

Full documentation is [available on readthedocs](http://basilisk.readthedocs.org/)

```javascript
var Person = basilisk.makeStruct(['name', 'age', 'addresses']),
    Address = basilisk.makeStruct(['city', 'country']),
    joe;
    
joe = new Person({
    name: 'Joe Bloggs',
    age: 32,
    addresses: basilisk.Vector.from([
        new Address({
            city: 'London',
            country: 'United Kingdom'
        }),
        new Address({
          city: 'Cape Town',
          country: 'South Africa'
        })
    ]);
});
```

The key idea in Basilisk is that values are better when you have a consistent
way to **create new values from old ones.**

```javascript

// given joe from above.
var getOlder = function (past) {
    return past.with_('age', past.age + 1);
}

var joeNextYear = getOlder(joe);

console.log('joe will be', joeNextYear.age);
console.log('since he has not moved, joe has the same addresses:', 
   joe.addresses === joeNextYear.addresses); 
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

