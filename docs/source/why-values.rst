.. _why-values:

===========
Why Values?
===========

On the face of it, software is all about change: click a button, 
type some text, animate a graph.  It seems a reasonable assumption, then, 
that the key element inside applications should be *changing* data: a person's
name is updated, an address is removed, a position is modified.  

The challenge comes when many parts of a program all need to reflect a particular
piece of shared state.  At that point, you need to be able to message many things
when a particular piece of data is changed.  This becomes *exceptionally* 
difficult once you have composed two different structures: If a person has an
address and the address is modified, how to you know to inform all observers of
the person?

