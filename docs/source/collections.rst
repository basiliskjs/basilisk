.. _collections:

===========
Collections
===========

Basilisk has good implementations of the most important data structures for 
application work.  All collections are **immutable** - methods which would
mutate them (in normal code) return new versions of the collections.

Where time complexity is stated, recall that log :sub:`32` of 1 billion is just
less than 6.

Vector
======

.. class:: Vector
    
    The Vector class is a random access data structure which can be accessed
    by numeric key.  Push, pop and set are all O(log :sub:`32` n), which makes the
    time complexity very low for practical datasets.

    Note that - as for all Basilisk collections - the constructor is private
    and the ``from`` static method should be used instead. 

.. staticmethod:: Vector.from([source : mixed]) -> Vector

    Creates a new Vector from the specified source object.

    :param source: 
        An ``array``, ``Vector``, or object with a ``.forEach`` method.  This
        will be iterated to fill the vector.  Passing ``null`` will result in
        an empty Vector.

.. attribute:: Vector.length : number

    The number of elements in the Vector.  This is a pre-computed property,
    so access is O(1)

.. method:: Vector.get(index : number) -> any

    Retrieve the value at a particular position in the Vector.  Note that
    (unlike Javascript arrays) retrieving a position which is outside the
    range of the collection is an Error.
    Time complexity: O(log :sub:`32` n)

    :param index:
       The position in the vector to return.  Must be in the range
       (-length ; length).  Negative indexes are interpreted as being from
       the end of the vector (ie. ``.length + index``).

.. method:: Vector.push(value : any) -> Vector

    Creates a **new Vector** which has the specified value in its last 
    position.  The instance on which it is called is not modified.
    Time complexity: O(log :sub:`32` n)

.. method:: Vector.set(index : number, value : any) -> Vector

    Creates a **new Vector** which has the specified position replaced
    with the specified value.  If the value ```===``` the current value
    in that position, will return ``this``.
    Time complexity: O(log :sub:`32` n)

    :param index: a number in the range (-length ; length).

.. method:: Vector.pop() -> Vector

    Time complexity: O(log :sub:`32` n)

    :return:
        a **new Vector** which has the item in the final position
        removed.


.. method:: Vector.peek() -> any
    
    Returns the last element in the Vector.

.. method:: Vector.forEach(callback: function (item : any, index : number), context:any)
    
    Iterates over the Vector in order, calling the ``callback`` for each 
    element in turn.  It is perfectly valid to pass a function which takes 
    fewer arguments (ie. ``function (item)`` instead of ``function (item, key)`` - 
    this is handled natively by Javascript). 

.. method:: Vector.equals(other : any) -> boolean

    Checks whether the two Vectors are **equal**.  Each element is checked in 
    turn.  If all elements are **equal** (see :ref:`equality-protocol`)

    :param other: 
        Another object to check for equality.  If this is **not** a Vector, this 
        will never return true.

.. method:: Vector.find(finder : function (item : any, index : number), context:any) -> any

    Iterates over the Vector in order, calling ``finder`` for each element in turn
    until ``finder`` returns true.

    :return:
        the first item for which ``finder`` returns true, or ``undefined`` if
        it never does.

.. method:: Vector.map(mapper : function (item : any, index : number), context:any) -> Vector

    Apply a function to all the elements in a vector, and return a new vector containing
    the result of those calls.

    :param mapper:
        A function which takes an item (and optionally its index) from the current
        vector, and returns an object for the new vector.
    :returns:
        A new Vector containing the results of applying the mapper to the
        contents of `this` in order.

.. method:: Vector.sort( compare? : function (a:T, b:T) -> number ) -> Vector

    :returns:
        A sorted version of the Vector, after applying the ``compare`` function.
        If no function is provided, it will use the standard javascript comparison.

.. method:: Vector.toArray() -> []

    Creates an new javascript array containing the elements in the Vector.
    This is useful when interoperating with javascript libraries which
    do not support Vector objects.

    :returns:
        A javascript array containing the elements from this Vector.

.. method:: Vector.splice(index : number, howMany : number[, element1 [, ... [, elementN ]]]) -> {spliced: Vector; removed: Vector}

    Like the javascript Array.prototype.splice() method, only because the Vector is
    immutable, this returns both the 'spliced' Vector and the items that were removed
    by the operation.

    :param index:
        Index at which to start changing the vector. If greater than the length of the vector,
        actual starting index will be set to the length of the vector. If negative, will begin
        that many elements from the end.

    :param howMany:
        An integer indicating the number of old array elements to remove. If howMany is 0, no
        elements are removed. In this case, you should specify at least one new element. If
        howMany is greater than the number of elements left in the array starting at index,
        then all of the elements through the end of the array will be deleted. If no howMany
        parameter is specified (second syntax above, which is a SpiderMonkey extension), all
        elements after index are removed.

    :param element1, elementN:
        The elements to add to the vector. If you don't specify any elements, splice simply
        removes elements from the array.

    :return:
        An object containing a new Vector with what the original array would have become after
        a traditional Javascript 'splice()' operation, and another new Vector containing those
        items that were removed from the original vector.

    For example:

    .. sourcecode:: javascript

        var a = new Person({
            'name': 'joe',
            addresses: new basilisk.Vector.from([
                new Address({ country: 'RSA' }),
                new Address({ country: 'Wales' }),
                new Address({ country: 'England' })
            ])
        }),
            b;

        b = a.splice(0, 1, new Address({ country: 'China'}), new Address({ country: 'Scotland'}));

        a.addresses.get(0).country; // 'RSA';
        b.addresses.get(0).country; // 'China';
        b.addresses.get(1).country; // 'Scotland';
        b.addresses.get(2).country; // 'Wales';

StringMap
=========

.. class:: StringMap

    A ``HashMap`` of ``strings`` to any other object.  In Typescript, this class
    is generic on type ``T`` of the stored objects.

    Note that - as for all Basilisk collections - the constructor is private
    and the ``from`` static method should be used instead. 

.. staticmethod:: StringMap.from([source : mixed]) -> StringMap

    Create a new StringMap from the specified source object.  

    If the object is a StringMap, then that object is returned directly.  

    Finally, the object is iterated using ``for in`` and own properties
    are added to the map.

.. method:: StringMap.get(key : string[, default: any = undefined]) -> any

    Retrieve the value stored against the key.  If it is not present,
    then the default will be returned (if none is provided, ``undefined`` is 
    returned.)

.. method:: StringMap.set(key : string, value: any) -> StringMap

    Returns a new StringMap with the added relation.  The original map is 
    **not changed**.

.. method:: StringMap.remove(key : string) -> StringMap

    Returns a new StringMap with the relation removed, if it was ever present.  
    The original map is **not changed**.

.. method:: StringMap.has(key : string) -> boolean

    Returns whether the specified key is set in the map.  Note that ``undefined`` 
    is a perfectly legitimate value, so "set" is not the same as "not undefined".

.. method:: StringMap.forEach(function (value : any, key : string) [, context: any = undefined]) -> any

    Iterate over the elements of the map in an undefined order.  The function will be called
    with the value and key for each item in turn.  Optionally, you can specify a context
    which will appear as ``this`` to the function.

.. method:: StringMap.values() -> Vector

    Returns a Vector containing the values in the StringMap, in an undefined order.

.. method:: StringMap.keys() -> Vector

    Returns a Vector containing the keys in the StringMap, in an undefined order.

.. property:: size : number

    The number of items in this StringMap.

HashMap
=======

.. class:: HashMap

    A configurable HashMap of values.  In Typescript, this class
    is generic on type ``T`` of the stored objects, type ``K`` of keys.

    Note that - as for all Basilisk collections - the constructor is private
    and the ``from`` static method should be used instead. 

.. staticmethod:: HashMap.from(hashFn: function (key : any) -> Number, [source : mixed]) -> Vector

    Create a new HashMap from the specified source object.  The ``hashFn`` will
    be called every time the hash of a key needs to be evaluated, and should
    handle any object you might use as a key.  ``basilisk.hashCode`` is a 
    standard implementation which should handle most important cases.

    If the object is a HashMap and its hashFn ``===`` the provided function,
    then it will be returned directly.  Otherwise it will be iterated and
    each key passed through the provided hashFunction.

    Finally, the object is iterated using ``for in`` and own properties
    are added to the map.

.. method:: HashMap.get(key : any[, default: any = undefined]) -> any

    Retrieve the value stored against the key.  If it is not present,
    then the default will be returned (if none is provided, ``undefined`` is 
    returned.)

.. method:: HashMap.set(key : any, value: any) -> HashMap

    Returns a new HashMap with the added relation.  The original map is 
    **not changed**.

.. method:: HashMap.remove(key : any) -> HashMap

    Returns a new HashMap with the relation removed, if it was ever present.  
    The original map is **not changed**.

.. method:: HashMap.has(key : any) -> boolean

    Returns whether the specified key is set in the map.  Note that ``undefined`` 
    is a perfectly legitimate value, so "set" is not the same as "not undefined".

.. method:: HashMap.forEach(function (value : any, key : any) [, context: any = undefined])

    
    Iterate over the elements of the map in an undefined order.  The function will be called
    with the value and key for each item in turn.  Optionally, you can specify a context
    which will appear as ``this`` to the function.

.. method:: HashMap.values() -> Vector

    Returns a Vector containing the values in the StringMap, in an undefined order.

.. method:: HashMap.keys() -> Vector

    Returns a Vector containing the keys in the StringMap, in an undefined order.

.. function:: hashCode(key:any) -> uint

    Generate a hashCode for the provided object.  If the object has a 
    ``hashCode`` method, that will be called and the return returned.  
    For strings, numbers, booleans, null and undefined, a default hash 
    implementation is used.

    If none of the above apply a TypeError is thrown.

    Hash functions should be fast, deterministic, and well distributed over
    the integers.

.. property:: size : number

    The number of items in this HashMap.

