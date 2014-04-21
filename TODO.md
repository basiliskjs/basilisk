TODO
====

Basilisk is useful today, especially if your collections are not especially large. If you are
performing updates on large items (> 200 items) you may not find the performance to be acceptable
to you.

General
-------

* Benchmarks: without numbers, any datastructures we add will just be guessing.
* A single 'build' command to generate commonjs, amd, and a raw version of the library
  (with the necessary d.ts modifications) would be great.

Datastructures
--------------

* Pull in or write an implementation of a PersistentBitmapTrie for Vectors and HashMaps.  
* A set would probably be useful, but doing it properly requires a hash implementation.
* Once we have sane versions of the data structures, we should include the standard functional 
  interface on all of them.

Query
-----

* What are the essential features

Example apps
------------

It would be good to write something we can ship, which ideally demonstrates some of the 
nice performance characteristics and aggregate logic.
