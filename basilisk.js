//      Basilisk 0.1 
//      A simple library for immutable state.
//      
//      (c) 2012 Moo Print Ltd. under an MIT license
//      see http://github.com/moodev/basilisk

(function (root, factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require('underscore'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['underscore'], factory);
    } else {
        // Browser globals
        root.basilisk = factory(root._);
    }
}(this, function (_) {
    "use strict";
    // bind to window or global, depending on environment.

    var basilisk  = {};

    if (!_) {
        throw "Basilisk depends on underscore: please ensure that underscore is loaded first.";
    }


    // TODO we log watcher-failure and a few other events - they are considered
    //      "broken" behaviours.

    var log = function () { };
    if (window && window.console && window.console.log) {
        log = function () { window.console.log.apply(window.console, arguments); }
    }

    // Atoms provide a way to manage shared, synchronous, independent state.
    // http://clojure.org/atoms
    //
    // If supplied the validator must be a function (new, old) {} -> boolean, 
    // returning true if the changed value is valid, and false if not.
    //
    // the value must be immutable.
    basilisk.Atom = function (initialValue, validator) {
        if (!this instanceof basilisk.Atom) { throw "Please instantiate each atom separately." }

        // Most state is held in closure, and thus can only be changed by these
        // privileged methods.

        var current,
            self = this,
            // TODO replace with a FixedVector.
            watchers = basilisk.collections.ForwardList.from([]),
            // set the value if it passes the validator.
            _set = function (possible) {
                var old = current;
                if (possible !== current) {
                    if (!validator(possible, current)) {
                        throw "Value does not pass validator.";
                    }

                    current = possible;

                    watchers.each(function (watcher) {
                        try {
                            watcher(current, old);
                        } catch (e) {
                            // do nothing
                            log("Watcher threw exception: this behaviour is broken.");
                        }
                    });
                }
                
                return current;
            };

        validator = validator || function () { return true; };
        // we fail immediately if the initial value does not validate.

        _.extend(self, {
            // Retrieve the current value of the Atom.
            deref: function () { return current; },

            // Applies the given "change" function to the old state,
            // checks that the result passes the validator, and updates the current state.
            // 
            // Will be called as swapFunction(old, *args);  The function should have no side-effects.
            //
            // Returns the new state or throws an exception.

            swap: function (swapFunction) {
                var possible, args = [current];

                if (arguments.length > 1) {
                    args.push.apply(args, _.rest(argument));
                }

                possible = swapFunction.apply(null, args);

                // update current, call watchers
                return this.compareAndSet(current, possible);
            },

            // If oldVal matches current, change to using newVal.
            // return true if changed, false if not changed.
            compareAndSet: function (oldVal, newVal) {
                if (oldVal === current) {
                    return (_set(newVal) === newVal);
                } else {
                    return false;
                }
            },

            // add a watcher.  Will be called if the value changes.
            addWatcher: function (watcher) {
                if (watchers.first(function (compare) { return compare === watcher; }) === undefined) {
                    watchers = watchers.shift(watcher);
                }
            },

            removeWatcher: function (watcher) {
                watchers = watchers.filter(function (compare) { return compare !== watcher; });
            }
        });

        // shorter alias for cas.
        this.cas = this.compareAndSet;

        // set the initial state.
        _set(initialValue);
    };

    // Definitions
    // -----------
    //
    // Helpers for class definition: 

    // whether defineProperty is available and functions according to ES5.1
    var defineAvailable = false,
        defineProperty = Object.defineProperty,
        _eg = {};

    // IE8 has a badly implemented version of defineProperty, so function detection
    // is insufficient.
    try {
        Object.defineProperty(_eg, 'x', {value:13, writable:false});
        try { _eg.x = 14; } catch (e2) {}
        defineAvailable = (_eg.x === 13);
    } catch (e) {
        defineAvailable = false;
    }

    if (defineAvailable) {
        Object.defineProperty(basilisk, 'isStrict', {
            value: true,
            writable: false,
            enumerable: true
        });
    } else {
        basilisk.isStrict = false;
    }

    // Definitions module.
    basilisk.definitions = {};

    // Create a class constructor.
    // actual contents of properties is undefined.
    basilisk.definitions.makeConstructor = function (properties) {
        var constructor,
            propList = _.extend({}, properties);

        // cannot have a property called with_ in the list.

        if (properties['with_']) {
            throw "You cannot have a property called with_ in your list: this is used within the Basilisk defition system.";
        }

        // generate the actual contructor.
        if (!defineAvailable) {
            constructor =  function (sample) {
                var self = this,
                    sample = sample || {},
                    origValues = _.extend({}, sample);

                // microoptimisation 
                if (sample instanceof constructor) { 
                    return sample;
                }

                if (!self instanceof constructor) {
                    throw "Object must be instantiated with new.";
                }

                // we don't actually have any guarantee of immutability
                // in this scenario: we will have to rely on failure modes 
                // being caught in modern browsers.
                _.each(propList, function (value, key) {
                    var valueFn = value.filter || _.identity;
                    self[key] = valueFn(sample[key] || undefined);
                });
            };
        } else {
            // create a fully immutable object chain.
            constructor = function (sample) {
                var self = this,
                    sample = sample || {};

                if (sample instanceof constructor) { 
                    return sample;
                }

                if (!self instanceof constructor) {
                    throw "Object must be instantiated with new.";
                }

                _.each(propList, function (value, key) {
                    var valueFn = value.filter || _.identity;
                    Object.defineProperty(self, key, {
                        value: valueFn(sample[key] || undefined),
                        writable: false,
                        enumerable: true
                    });
                });
            };
            
        }


        // Create a new version of the object, with the specified "adjusted"
        // properties set to their specified values (and un-specified properties
        // set to their value in the current object.)
        constructor.prototype.with_ = function (adjustProperties) {
            // *we* are a perfect reference sample, since defineProperty
            // ensures immutability.
            var self = this,
                sample = {},
                changed = false;
            _.each(propList, function (value, key) {
                var valueFn = value.filter || undefined,
                    strictEqual = value.strictEqual || undefined,
                    rawValue, 
                    value;

                if (Object.hasOwnProperty.call(adjustProperties, key)) {
                    rawValue = adjustProperties[key];
                } else {
                    rawValue = self[key];
                } 

                if (valueFn) { 
                    value = valueFn(rawValue); 
                } else { 
                    value = rawValue; 
                }

                if (strictEqual) {
                    changed = changed || !strictEqual(value, self[key]);
                } else {
                    changed = changed || (value !== self[key]);
                }

                sample[key] = value;
            });

            if (!changed) { return self; }
            return new constructor(sample);
        }

        // add a properties object, with the original properties defined.
        constructor._properties = function () { return propList.slice(0, propList.length); };

        // TODO: handle definitions for complex objects.
        _.each(propList, function (value, key) {
            var withLabel = key;
            withLabel = withLabel[0].toUpperCase() + withLabel.slice(1, withLabel.length);
            withLabel = 'with' + withLabel;
            
            constructor.prototype[withLabel] = function (value) {
                var adjust = {};
                adjust[key] = value;
                return this.with_(adjust);
            }
        });

        return constructor;
    } 

    // some very simple property objects.  the float value is particularly useful.
    basilisk.properties = {
        floatProperty: {
            strictEquals: function (a, b) {
                return Math.abs(a - b) < 0.00001;
            }
        },
        forwardListProperty: {
            filter: function (value) {
                return basilisk.collections.ForwardList.from(value);
            }
        }
    }

    // Standard Watcher creation functions
    // ----
    //
    // A *lot* of watching boils down to some very simple patterns:
    //   - watch only when a specified property changes
    //   - watch only when a specified property (on a path) changes
    //   - watch for a change in a particular key in a dictionary.
    // 
    // Rather than leave a lot of boilerplate lying around (and hopefully to allow
    // for optimisation and collapsing of functions), you can use the creation functions
    // below here to create new functions which can be used as watchers.

    basilisk.watchers = {};

    // TODO these are very much first-pass implementations: replace with something
    // substantially more clever.

    // Watcher function for a dotted path inside a particular atom.  
    // will call the "watcher" function with the "stemmed" properties
    // @return fn watching a particular path.
    basilisk.watchers.path = function (path, watcher) {
        var parts = path.split('.'),
            // function to extract the specified path from the root.
            // WILL mutate the parts parameter.
            recur = function (parts, newVal, oldVal) {
                var first = parts.shift(),
                    newRest, oldRest;

                // if newval === oldval, there's no change so no chance of a watch.
                if (newVal === oldVal) {
                    return;
                }

                if (oldVal !== undefined && _.has(oldVal, first)) {
                    oldRest = oldVal[first];
                };

                if (newVal !== undefined && _.has(newVal, first)) {
                    newRest = newVal[first];
                }

                if (parts.length == 0) {
                    // this is the leaf: if we see a difference in value, 
                    // apply it.

                    if (newRest !== oldRest) {
                        watcher(newRest, oldRest);
                    }
                } else {
                    recur(parts, newRest, oldRest);
                }
            };

        return function (newVal, oldVal) {
            recur(parts.slice(0, parts.length), newVal, oldVal);
        }
    } 

    // Collections
    // -----------
    // 
    // Very simple collection objects.  Not currently optimised for performance,
    // though that would not be exceptionally difficult to accomplish.

    basilisk.collections = {};

    // we routinely have methods that are called once, with no arguments.
    // (eg. length, etc.). Since we're immutable, as long as we cache the result
    // on "this", we can easily make ourselves perpetually cached.

    var oncePerInstance = function (method, key) {
        // we store our value on "this", but with a long (probably unique) key...
        var storageKey = key || _.uniqueId('__basilisk-fn-oncePerInstance');

        return function () {
            var value;
            if (arguments.length > 0) {
                throw "Cannot supply any arguments to a once-per-instance function.";
            }
            if (!this.hasOwnProperty(storageKey)) {
                value = method.apply(this, []);
                if (defineAvailable) {
                    Object.defineProperty(this, storageKey, {
                        value: value,
                        writable: false,
                        enumerable: false
                    });    
                } else {
                    this[storageKey] = value;
                }
                
            } 
            return this[storageKey];
        }
    }

    // define basic datastructures for forward list (singly linked list)

    _.extend(basilisk.collections, {
        ForwardListNode: basilisk.definitions.makeConstructor({
            rest: { noWith: true },
            value: {}
        }),
        // A simple list, with O(1) shift and unshift.  Suitable for simple stacks.
        ForwardList: basilisk.definitions.makeConstructor({
          head: {}
      })
    });

    basilisk.collections.ForwardListNode.prototype.length = oncePerInstance(function () {
        if (this.rest === undefined) {
            return 1;
        } else {
            return 1 + this.rest.length();
        }
    }, '_length');


    // Instance methods on ForwardList.

    _.extend(basilisk.collections.ForwardList.prototype, {
        // create a node with the specified value, and return a list with that as its head.
        // this is a little more expensive here, but it makes iteration in the empty case
        // simple.
        shift: function (value) {
            var self = this;
            return new basilisk.collections.ForwardList({
                head: new basilisk.collections.ForwardListNode({
                    rest: self.head,
                    value: value
                })
            });
        },

        length: oncePerInstance(function () {
            if (this.head === undefined) {
                return 0;
            } else {
                return this.head.length();
            }
        }, '_length'),

        // return a list without the head node, 
        unshift: function () {
            var self = this,
            rest = undefined;

            if (self.head) {
                rest = self.head.rest;
            } else {
                return self;
            }

            return [this.head.value, new basilisk.collections.ForwardList({
                head: rest 
            })];
        },

        each: function (iterator, context) {
            var idx = 0,
            next = this.head;

            while (next !== undefined && next !== null) {
                iterator.apply(context, [next.value, idx, this, next]);
                idx += 1;
                next = next.rest;
            }
        },

        /**
         * Return a new ForwardList containing only those elements of this list for which 
         * the iterator function returns a truthy value.  
         *
         * @param filterFn a function taking (value, index, list, node) -> boolean
         * @return ForwardList
         */
         filter: function (filterFn, context)
         {
            var values = [],
            changedValue = false;

            this.each(function (value, idx, list, node) {
                if (filterFn.apply(this, arguments)) {
                    values.push(value);
                } else {
                    changedValue = true;
                }
            });

            if (!changedValue) {
                return this;
            } else {
                return basilisk.collections.ForwardList.from(values);
            }
        },

        /**
         * Returns the first value that matches the specified filter function.
         */
         first: function (filterFn, context) {
            var idx = 0,
            filterFn = filterFn || function () { return true; },
            next = this.head;

            while (next !== undefined && next !== null) {
                if (filterFn.apply(context, [next.value, idx, this, next])) {
                    return next.value;
                }
                idx += 1;
                next = next.rest;
            }

            return undefined;
        }
    });

    // Factory method: given an array-like object or a forward list, return a forward list.
    basilisk.collections.ForwardList.from = function (source) {
        if (source instanceof basilisk.collections.ForwardList) {
            return source;
        } else {
            return _.reduceRight(source, function (memo, value) { 
                return memo.shift(value);
            }, new basilisk.collections.ForwardList({ head: null }));
        }
    }

    return basilisk;
}));
