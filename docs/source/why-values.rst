.. _why-values:

===========
Why Values?
===========

We have a double-standard in programming:  when we do simple arithmetic or 
work with strings we do not expect the values we're using to be changed by 
our work.

.. sourcecode:: javascript

    var a, b, c;

    a = 5;
    b = 7;
    c = a + b;

    // we would not expect that a or b were changed by adding them together.

    a = 5;
    b = a;
    a += 10;

    // we expect that b is still "5".

    a = "Hello, "
    b = "Gill"

    c = a + b;

    // Again, we believe that a and b would not be changed by this.

We have long known that having simple values makes understanding software a lot
simpler:  numbers, booleans, and strings are all commonly **immutable** now: If
you pass one to a function you know that it will not be changed.  You may well
be returned a **different string** to use, but the one you started with is still
there for comparison.

In some languages (notably C) strings are **mutable**: anyone can change that.
While that makes in-place modification faster, it means that any code which 
interacts with strings needs to know whether it is allowed to change a particular
instance, and it is easy for bugs to arise as a result.

Application data
----------------

In Javascript (as with most programming languages) the higher-level objects we
use to do most of our programming are **mutable**: arrays, objects, and (if you have them
in your language) Maps must be changed in-place to effect change, or they must
be "deep-copied" to create a history if comparison is required.

The result of this is that any part of the code-base which can **see** an object
can **change** that object: we mix up the idea of "identity" with the idea of "value".
It thus becomes much harder to how your program moves from one state to another - 
a fact which looks great in demo code, but which is terrible for making changes or
debugging.

Change and Events
-----------------

The standard solution to the change problem is to use events:  when a property
is changed the host object (or the browser) fires an event to which other code
can be listening, and which can then perform additional updates as required.
That works reasonably well when you have very **flat** objects - a "User" object,
say, with 10 properties.  Change the ``username`` and an event is fired. 

This gets harder to manage when you have several properties which must be 
updated at the same time:  say ``x`` and ``y`` co-ordinates for an item in 
a scene.  A naive approach would see you updating first the ``x`` position, 
redrawing and then updating again.

Now: ``Object.observe`` provides a better solution to this in the mutable case
by delivering a stream of changes to handlers.  However, there are still some 
hard to follow cases there.

Dancing together
----------------

Even these tools don't work fantastically once you are co-ordinating many objects.
Consider a person with a list of addresses:

.. sourcecode:: javascript

    var gill = new Person({
        name: 'Gill Jones',
        addresses: {
            home: { country: 'United Kingdom', city: 'London' },
            holiday: { country: 'Ireland', city: 'Dublin' },
            birth: { country: 'South Africa', city: 'Cape Town' }
        },
        currentAddress: 'home'
    });

Now: changing something about the 'home' address has an impact on anyone
who is trying to list Gill's current address.  We would need to

 i. Add a listener to ``gill`` to watch for changes to the currentAddress property.
 ii. Add a listener to ``gill.addresses`` in case the ``home`` value was replaced
 iii.  Add a listener to ``gill.addresses['home']`` in case ``home`` is changed in some way.

 That's a huge amount of book keeping, just to track potential changes in one place.

 The alternative approach (using values) is to 

  i.  Be notified of all changes at the root.
  ii. Use ``===`` to quickly (pointer comparison, so very fast) check if the
      properties you care about (``.currentAddress``, ``.addresses``, 
      ``.addresses.get(gill.currentAddress)``) might have changed.

Vitally, you never have to bind to current instances of the child values: you only
ever need access to a single variable at the top of the tree.

In short
--------

Using events to observe changes to properties is a very **easy** solution to knowing 
about changes, but it makes **composite** objects very hard to reason about.  

Using values makes working with **composite** objects very simple: more composition
doesn't lead to spiralling complexity. 