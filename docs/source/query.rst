.. _querying:

=====
Query
=====

Creating an unchanging value is a very simple thing to do:  just instantiate
the things you want.  Programming is about **change**, and that's where the 
most important features of Basilisk are targetted.

The ``query`` module (which we usually bind to ``b$`` to keep our code 
clutter-free) allows you to create new versions of values in a way
which is simple to understand.

.. function:: basilisk.query.replace(initial : any, path : PathSegment[], changed: any) -> any

    Given an ``initial`` value, this returns a new value which has ``changed``
    substituted at the end of ``path``. 

    For example: 

    .. sourcecode:: javascript

        var a = new Person({ 
            'name': 'joe', 
            addresses: new basilisk.Vector.from([
                new Address({ country: 'RSA' }),
                new Address({ country: 'United Kingdom' })
            ])
        }), 
            b;

        b = b$.replace(a, ['addresses', b$.at(0), 'country'], 'South Africa');

        a.addresses.get(0).country; // 'United Kingdom';
        b.addresses.get(0).country; // 'South Africa';

    :param initial: a value you wish to derive a new value from.
    :param path: 
        ``PathSegments`` (or ``strings`` which will be converted into
        ``prop`` path segments.)
    :param changed: 
        the value to substitute at the end of the ``path`` in the newly created
        return value.

.. function:: basilisk.query.swap(initial : any, path : PathSegment[], swapFn : function(value) -> any) -> any

    Like ``replace``, but calls ``swapFn`` with the current value at the 
    end of the chain, and replaces the end value with the result. 

    For example: 

    .. sourcecode:: javascript

        var a = new Person({ 
            'name': 'joe', 
            addresses: new basilisk.Vector.from([
                new Address({ country: 'United Kingdom' })
            ])
        }), 
            b;

        b = b$.swap(a, ['addresses', b$.at(0), 'country'], function (country) {
            // normalise common abbreviations of South Africa 
            if (country === 'RSA' || country == 'ZA') {
                return 'South Africa';
            } else {
                return country;
            }
        });

        a.addresses.get(0).country; // 'United Kingdom';
        b.addresses.get(0).country; // 'South Africa';


    :param initial: a value you wish to derive a new value from.
    :param path: 
        ``PathSegments`` (or ``strings`` which will be converted into
        ``prop`` path segments.)
    :param swapFn:
        A function to be called with the value at the end of the path.
        The return value will be substituted at the end of the path, in the
        newly created result.

.. function:: basilisk.query.path(...pathsegments) -> Path

    Create a new Path object from the specified Path Segments.  ``strings`` will
    be converted into ``prop`` segments.

    :param pathsegments: 
        ``string``'s or ``PathSegment``'s which will be stored and can be
        used to ``swap`` or ``apply``

Path
----

A Path is an ordered list of Path Segments, which can be applied to many values
to produce updated versions.  

.. class:: Path 

    (Interface) A Path which can be applied to many different values.

.. method:: swap(initial : any, swapFn : function(value) -> any) -> any

    Like the ``query.swap`` method, but with this path applied.

.. method:: replace(initial : any, changed : any) -> any

    Like the ``query.replace`` method, but with this path applied.
    

PathSegment
-----------


The ``swap`` and ``replace`` functions are wrappers around Path objects,
which are made up of *path segments*.  A 
path object allows you to

 * find the next value in a chain.
 * replace that value with a new one.

This is where the ``Struct`` interface becomes very important:

.. sourcecode:: javascript

    var b$ = basilisk.query,

        Person = basilisk.makeStruct(['name', 'age']),
        joe = new Person({ name: 'Joe Bloggs', age: 32 }),

        changed,

        propSegment;

    // basilisk.query.prop is a path segment that looks at Struct properties.

    propSegment = b$.prop('age');

    propSegment.current(joe);   // returns '32'
    changed = propSegment.replace(joe, 35);   

    /**
    
    Changed will now be:

     {
        name: 'Joe Bloggs',
        age: 35
     }  
    */

The path constructor (called by ``swap`` or ``replace``) will convert any plain
string to a prop segment.

The ``basilisk.query.at`` path segment will work with any collection or object
which has both ``.get`` and ``.set`` methods.  The ``.set`` method must produce
a *new* value with the key replaced.  Keys can be any type that the collection
understands (and collections should throw an error if they aren't).

For example:

.. sourcecode:: javascript

    var b$ = basilisk.query,

        numbers = basilisk.Vector.from([10, 11, 12, 13]),

        segment;

    segment = b$.at(3);

    segment.current(numbers);   // returns 13
    segment.replace(numbers, 9); // returns V([10, 11, 12, 9])

Any object can be used in a path, as long as is has all the methods on the 
PathSegment interface.

.. class:: PathSegment

    (Interface) Any object which has all the methods on the PathSegment interface 
    can be used in a Path.  PathSegments **must** be immutable - they can be
    cached and re-used.

.. method:: current(from : any) -> any

    Given an object, descend a step into it as appropriate for the segment.

    For example, prop segments simply do ``value[key]`` where ``key`` is 
    configured at creation time.  

    :returns: the next value in the path.

.. method:: replace(from : any, changed : any) -> any

    Perform the update appropriate for the path segment on the ``from``
    parameters, using ``changed`` as the property.

Basic Path Segments
-------------------

Basilisk comes with a small set of generic path segments, which 

.. function:: basilisk.query.prop(propertyName : string) -> PathSegment

    Creates a PathSegment which will descend and replace a single property
    in a Struct.

.. function:: basilisk.query.at(key : any) -> PathSegment

    Creates a PathSegment which will apply the ``key`` to the ``.get`` and
    ``.set`` methods of a collection.





