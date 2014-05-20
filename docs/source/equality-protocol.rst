:: _equality-protocol:

========
Equality
========

Checking whether two objects are **equal** is a key operation with values.
If two objects are values, then ``===`` always means that the objects are equal.
However, for Objects the opposite is not true: 

.. sourcecode:: javascript

    // Assuming Person is a  Basilisk  makeStruct() Constructor
    var a = new Person({ name: 'Joe', age: 32 }),
        b = new Person({ name: 'Joe', age: 32 });

    a === b;    // false
    a.name === b.name;  // true
    a.age === b.age; // true

