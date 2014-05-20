:orphan:

Basilisk
========

Basilisk is a **value** library for Javascript.  It allows you to create
**immutable** data in a familiar way, and to **derive new versions** from that
data.  

.. sourcecode:: javascript

    var Person = basilisk.makeStruct(['name', 'age']),
        example = new Address({ name: 'Joe', age: 32 }),
        older = example.with_('age', example.age + 2);

Making code which updates deeply nested structures **simple** and **clear** 
is library's main aim.

.. sourcecode:: javascript

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

User Guide
----------

.. toctree::
   :maxdepth: 2

   why-values
   getting-started
   collections
   query