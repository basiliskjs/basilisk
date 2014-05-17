.. _getting-started:

Getting Started
===============

Structs
-------

The first important idea in Basilisk is the ``struct``.  A ``struct`` is an
object that has a ``with_`` method.

.. sourcecode:: javascript

   var joe = new Person({ name: 'Joe' });

   // Properties can be accessed directly.
   console.log('basic value', joe.name);

   // You can derive a new value using 'with_'
   console.log('adjusted', joe.with_('name', 'Joe Bloggs').name);

   // The original value is - of course - not modified by deriving a new value.
   console.log('original value', joe.name);
 
An easy way to make constructors for structs is the ``makeStruct`` function.

.. sourcecode:: javascript

   var Person = basilisk.makeStruct(['name', 'age']),

       joe = new Person({ name: 'Joe' });

You can of course extend the prototype with any additional methods you like

.. sourcecode:: javascript

    Person.prototype.toString = function () { 
        return this.name + ' (' + this.age + ')'; 
    }

    console.log('I am ' + joe);

One additional method is created for you automatically: ``.equals()``.  We'll
come back to that in a little bit.

Collections
-----------

In a huge number of cases, you don't need to create your own structures to
represent data:  lists and maps will do just fine.  Basilisk comes with these
essential data structures in a persistent [#persistent]_ and performant form.  

.. sourcecode:: javascript

    // Vectors have fast append, and fast random access (including set)
    var numbers = basilisk.Vector.from([]),
        numbers = numbers.push(5),
        numbers = numbers.push(6),
        numbers = numbers.push(7);

    console.log(numbers.get(1));
    numbers = numbers.set(1, 10);

    // .length is O(1)
    console.log(numbers.length);

The StringMap class gives a simple, safe map from strings to any value.

.. sourcecode:: javascript

   var students = basilisk.StringMap.from({});

   students = students.set('Joe', 'Joe Bloggs');

   console.log(students.get('Joe'));
   // .get accepts a default (undefined is the default value)
   console.log(students.get('Mary', 'not present'));

   // Unlike normal javascript objects, StringMaps are safe for any string.
   students.set('__proto__', 'Does not break the object');

The HashMap class is a more flexible mapping object - see its detailed
documentation for more info.

Query
-----

Creating immutable objects in Javascript is actually very easy: just use
``Object.freeze``.  However, deriving new versions of complex objects in a way
which is both fast and easy to read is more of a challenge.  Basilisk has a 
``query`` module to make this easier.  We often bind this to ``b$`` to 
make our code a little clearer.

.. sourcecode:: javascript

    var b$ = basilisk.query,
        example = make_a_complex_object();

    console.log('Deep access:', example.deep.prop);

    // changing 'prop' to be a new value would involve 'backward' reasoning
    // in most environments:

    example = example.with_('deep', example.deep.with_('prop', 5));

    // with basilisk structs, this is clearer:
    console.log(b$.replace(example, ['deep', 'prop'], 5));

    // Where you are modifying more properties, or deriving a changed value
    // use swap

    console.log(b$.swap(example, ['deep', 'position'], function (current) {
        return current
            .with_('x', current.x + 5)
            .with_('y', current.y + 10);
    }));

    // the second parameter (the path) can include more intelligent matchers

    console.log(b$.replace(example, ['deep', b$.at(5)], 'hello'));

    // basilisk.query.at() will handle any collection which uses .get and .set
    // - so Vector, HashMap, and StringMap at the very least.

Equality
--------

Probably the most useful thing about working with value objects is that
strict equality (``===``) means that the objects **and their children** are 
exactly the same - and the check is incredibly quick.

There are many situations, however, where you want to check if two objects
are the **same**: for this, basilisk supports ``.equals``.

.. sourcecode:: javascript

    var personA = new Person({ name: 'Joe' }),
        personB = new Person({ name: 'Mary' }).with_('name', 'Joe');

    console.log('Not the same: ', personA === personB);

    // however, it *is* valuable to know if they are identical:

    basilisk.equals(personA, personB); // returns true.



.. rubric:: Footnotes 

.. [#persistent] a persistent data structure is a data structure that always 
                 preserves the previous version of itself when it is modified.