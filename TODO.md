TODO
====

Basilisk is useful today, especially if your collections are not especially large. If you are
performing updates on large items (> 200 items) you may not find the performance to be acceptable
to you.

General
-------

* A single 'build' command to generate commonjs, amd, and a raw version of the library
  (with the necessary d.ts modifications) would be great.

Datastructures
--------------

* Benchmarks: having a good set of benchmarks will help us to tune the basic datastructures.
* A Set implementation should be fairly straightforward, given the PersistentHashMap 
  implementation we already have. 

Query
-----

* Do we need a 'exists' operator to check if the path is valid?
