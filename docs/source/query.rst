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

.. function:: replace(initial : any, path : PathSegment[], changed: any) -> any

    Given an ``initial`` value, this returns a new value which has ``changed``
    substituted at the end of ``path``. 

    For example: 

    .. sourcecode:: javascript

        var a = new Person({ 
            'name': 'joe', 
            addresses: new basilisk.Vector.from([
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

.. function:: swap(initial : any, path : PathSegment[], swapFn : function(value) -> any) -> any

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

        b = b$.replace(a, ['addresses', b$.at(0), 'country'], function (country) {
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