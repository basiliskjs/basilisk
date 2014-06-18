/**
 * Basilisk is a library for working with immutable data in Javascript or
 * related languages.
 */

// internal shims for a few es5 functions which we cannot reasonably expect people to shim.
var freeze = (Object.freeze) ? (obj:any):any => { return Object.freeze(obj) } : (obj:any):any => { return obj; },
    hasProp = function (obj, prop):boolean { return Object.hasOwnProperty.call(obj, prop); },
// loosely identify if objects have the same type, mainly used for basilisk-originated objects.
// returns false if both are null or undefined
    sameType = function (a:any, b:any):Boolean {

        if (a === null || b === null || a === undefined || b === undefined) {
            return false;
        }

        if (a.constructor === undefined || b.constructor  === undefined) {
            return false;
        }

        return a.constructor === b.constructor;
    };

export interface Struct {

    /**
     * Given an "example" object, this will create a new object of the same
     * 'type', but with the specified name overridden.
     *
     * @param propName
     * @param propValue
     */
    with_(propName:string, propValue:any):Struct;
}

export interface Sequence<T> {
    // immediately call fn for each item in the sequence.
    forEach(fn:(value:T) => any, context:any):void;
    forEach(fn:(value:T) => any):void;
}

export module ts {
    /**
     * A Typescript-specific implementation of Struct, which makes writing new
     * Structs easy.
     */
    export class Struct {
        constructor() {
            freeze(this);
        }

        /**
         * Return a new instance of this structure, replacing the named property with
         * the provided value.
         *
         * @param propName the property to replace.
         * @param propValue the value to replace.
         */
        public with_(propName:string, propValue:any):Struct {
            var altered = {},
                Maker:{ new(prop:any):Struct } = <{ new(prop:any):Struct }> this.constructor;
            for (var prop in this) {
                if (hasProp(this, prop)) {
                    altered[prop] = this[prop];
                }
            }
            altered[propName] = propValue;
            return new Maker(altered);
        }
    }
}

// in ES6 environments, this would be a singleton object.
var StopIteration = StopIteration || "StopIteration";

/**
 * Check whether two objects are logically the same.  For best effect, either object should
 * support a "equals" method.
 *
 * @param a
 * @param b
 * @returns {*}
 */
export function equals(a:any, b:any):boolean {
    if (a === b) {
        return true;
    }

    // if either is null or undefined at this point, they cannot be the same.
    if (a === null || b === null || a === undefined || b === undefined) {
        return false;
    }

    // if a supports equals, try it.
    if (typeof a.equals === 'function') {
        return a.equals(b);
    }

    // if b supports equals, try it.
    if (typeof b.equals === 'function') {
        return b.equals(a);
    }

    return false;
}

/**
 * Given a list of strings, create constructor function which will create instances of the
 * named 'class'.
 *
 * An 'equals' method is added to every struct, which will apply a basilisk-equality check to each
 * property in turn to determine equality.
 */
export function makeStruct(baseProps:Array<string>) {
    var props = baseProps.slice();

    for (var i =0; i<props.length; i++) {
        if (props[i].slice(0, 2) === '__') {
            throw "Properties of structs cannot start with __, to prevent collision with __proto__ and other core object behaviours.";
        } else if (props[i] === 'with_') {
            throw "Structs cannot have a 'with_' property, since that collides with the change protocol.";
        } else if (props[i] == 'equals') {
            throw "Structs cannot have an 'equals' method."
        }
    }

    var Constructor = function (opts:any) {
        for (var i=0; i<props.length; i++) {
            this[props[i]] = opts[props[i]];
        }
        freeze(this);
    };

    for (i=0; i<props.length; i++) {
        Constructor.prototype[props[i]] = null;
    }

    Constructor.prototype.with_ = function (propName:string, propVal:any) {
        var altered = {},
            found = false;

        if (this[propName] === propVal) {
            return this;
        }

        for (var i=0; i<props.length; i++) {
            altered[props[i]] = this[props[i]];
            if (props[i] === propName) {
                found = true;
            }
        }

        if (found && altered[propName] !== propVal) {
            altered[propName] = propVal;
            return new Constructor(altered);
        } else {
            return this;
        }
    };

    Constructor.prototype.equals = function (other) {
        if (this === other) {
            return true;
        }

        if (other === undefined || other === null) {
            return false;
        }

        // we we
        if (sameType(this, other)) {
            for (var i=0; i<baseProps.length; i++) {
                if (!equals(this[baseProps[i]], other[baseProps[i]])) {
                    return false;
                }
            }
            // no properties were not equal, thus we must be true.
            return true;
        } else {
            // since we have different prototypes, we must be different objects.
            return false;
        }
    }

    return Constructor;
}

/**
 * A basic persistent vector class.  This is *not* backed by a complex datastructure, and will
 * perform very badly for non-trivial data sizes.
 */
export class ArrayVector<T> implements Sequence<T> {
    // @private
    constructor(ignored:any, ref:Array<T>) {
        if (ignored !== undefined) {
            throw "TypeError: Vector constructor is private: please use Vector.from()";
        }

        this.instance = ref;
        this.length = this.instance.length;

        freeze(this);
    }

    public static from<T>(sample:ArrayVector<T>):ArrayVector<T>;
    public static from<T>(sample:Array<T>):ArrayVector<T>;
    public static from<T>(sample:Sequence<T>):ArrayVector<T>;

    public static from<T>(sample:any):ArrayVector<T> {
        var ref:Array<T>;

        if (sample == null) {
            ref = [];
        } else if (sample instanceof ArrayVector) {
            return sample;
        } else if (typeof sample.forEach == 'function') {
            ref = [];
            sample.forEach(function (val:T) {
                ref.push(val);
            });
        }
        return new ArrayVector(undefined, ref);
    }

    private instance:Array<T>;
    public length:number;

    public append(value:T):ArrayVector<T> {
        var copy = this.instance.slice(0);
        copy.push(value);
        return new ArrayVector<T>(undefined, copy);
    }

    /**
     * Retrieve the object at a particular index. Raises
     */
    public get(index:number):T {
        if (typeof index !== "number") {
            throw "Cannot index a vector with anything other than a number.";
        }

        if (index < 0) {
            index = this.length + index;
        }

        if (index > this.length || index < 0) {
            throw "Out of bounds for Vector";
        }

        return this.instance[index];
    }

    /**
     * Create a new vector, with the specified index replaced within the object.
     */
    public set(index:number, value:T):ArrayVector<T> {
        // this will check that we have been indexed by a number.
        if (equals(this.get(index), value)) {
            return this;
        }

        if (index < 0) {
            index = this.length + index;
        }

        if (index >= this.length || index < 0) {
            throw "Out of bounds";
        }

        var adjusted = this.instance.slice();
        adjusted[index] = value;
        return new ArrayVector<T>(undefined, adjusted);
    }

    public forEach(fn:(value:T, index:number, vect:any) => any, context:any = null):void {
        for (var i=0; i < this.instance.length; i++) {
            fn.call(context, this.instance[i], i, this);
        }
    }

    public filter(fn:(value:T, index:number, vect:any) => boolean, context:any = null):Sequence<T> {
        var replacement = [];
        for (var i=0; i < this.instance.length; i++) {
            if (fn.call(context, this.instance[i], i, this)) {
                replacement.push(this.instance[i]);
            }
        }
        return new ArrayVector<T>(undefined, replacement);
    }

    public find(fn:(value:T, index:number, vect:any) => boolean, context:any = null):T {
        for (var i=0; i < this.instance.length; i++) {
            if (fn.call(context, this.instance[i], i, this)) {
                return this.instance[i];
            }
        }
        return undefined;
    }

    public equals(other:any):boolean {
        if (this === other) {
            return true;
        }

        if (other === null || other === undefined) {
            return false;
        }

        if (this.length != other.length) {
            return false;
        }

        // case where it is a vector.
        if (sameType(this, other)) {
            // must be an Array<T>
            for (var i=0; i < this.instance.length; i++) {
                if (!equals(other.instance[i], this.instance[i])) {
                    return false;
                }
            }
        }

        return true;
    }
}

/**
 * A Simple StringMap which can store any object, keyed on a string.
 *
 * This implementation is convenient when working on the console, but should not be used for more than 40-50 items.
 */
export class SimpleStringMap<T> implements Sequence<T> {
    // @private
    constructor(ignore:any, inst:any) {
        if (ignore !== undefined) {
            throw "TypeError: StringMap constructor is private - use .from() to create new instances."
        }
        this.instance = inst;
        freeze(this);
    }

    public static from<T>(sample:SimpleStringMap<T>);
    public static from<T>(sample:any);

    public static from<T>(sample:any) {
        var inst = {};

        if (sample !== null && sample !== undefined) {
            if (sample instanceof SimpleStringMap) {
                inst = sample.instance;
            } else {
                for (var k in sample) {
                    if (hasProp(sample, k)) {
                        inst[sm.convertKey(k)] = sample[k];
                    }
                }
            }
        } else {
            throw "TypeError: invalid object";
        }

        return new SimpleStringMap(undefined, inst);
    }

    private instance:Object;

    public get(key:string, default_:T = null):T {
        var actualKey:string = sm.convertKey(key);

        if (hasProp(this.instance, actualKey)) {
            return this.instance[actualKey];
        }
        return default_;
    }

    public set(key:string, value:T):SimpleStringMap<T> {
        var altered = {};
        if (equals(this.get(key), value)) {
            return this;
        }
        for (var prop in this.instance) {
            if (hasProp(this.instance, prop)) {
                altered[prop] = this.instance[prop];
            }
        }
        altered[sm.convertKey(key)] = value;

        // Cheat, knowing that we will use the "instance" property.
        return new SimpleStringMap<T>(undefined, altered);
    }

    public has(key:string):boolean {
        return hasProp(this.instance, sm.convertKey(key));
    }

    public remove(key:string):SimpleStringMap<T> {
        var altered = {},
            actualKey = sm.convertKey(key);

        for (var prop in this.instance) {
            if (hasProp(this.instance, prop)) {
                if (prop !== actualKey) {
                    altered[prop] = this.instance[prop];
                }
            }
        }

        return new SimpleStringMap<T>(undefined, altered);
    }

    public forEach(fn:(value:T, key:string, source:any) => any, context:any = undefined):void {
        for (var prop in this.instance) {
            if (hasProp(this.instance, prop)) {
                fn.call(context, this.instance[prop], sm.reverseKey(prop), this);
            }
        }
    }

    // Equality for StringMaps is defined as being a StringMap with the same keys, and for each
    // key the value must be equals().
    public equals(other:any) {
        if (this === other) {
            return true;
        }

        if (Object.getPrototypeOf(this) !== Object.getPrototypeOf(other)) {
            return false;
        }

        for (var prop in this.instance) {
            if (this.instance.hasOwnProperty(prop)) {
                if (!equals(this.instance[prop], other.instance[prop])) {
                    return false;
                }
            }
        }

        for (var prop in other.instance) {
            if (other.instance.hasOwnProperty(prop)) {
                if (!this.instance.hasOwnProperty(prop)) {
                    return false;
                }
            }
        }

        return true;
    }
}

// private utilities for the StringMap implementation.
module sm {
    export function convertKey(key:string):string { return key + '___'; }
    export function reverseKey(key:string):string { return key.substr(0, key.length - 3); }
}

export class Vector<T> implements Sequence<T> {
    constructor(root:Array<any>, shift:number, length:number) {
        this.root = root;
        this.shift = shift;
        this.length = length;

        freeze(this);
    }

    public length:number;
    private root:Array<any>;
    private shift:number;

    public get(index:number):T {
        index = v.rangecheck(index, this.length);

        var node = this.root;
        for (var level = this.shift; level > 0; level -= v.BITS) {
            node = node[(index >> level) & v.MASK];
        }

        return node[(index >> level) & v.MASK];
    }

    public peek():T {
        return this.get(this.length - 1);
    }

    public set(index:number, value:T):Vector<T> {
        index = v.rangecheck(index, this.length);

        var root = v.setIndex(this.root, this.shift, index, value);

        return new Vector<T>(root, this.shift, this.length);
    }

    public push(value:T):Vector<T> {
        var index = this.length;

        var root,
            shift = this.shift;

        // in the case that the root is full, we add an extra root.
        if (this.root.length === v.WIDTH) {
            shift = this.shift + v.BITS;
            root = v.setIndex([this.root], shift, index, value);
            root = root;
        } else {
            root = v.setIndex(this.root, shift, index, value);
        }

        return new Vector<T>(root, shift, this.length + 1);
    }

    public pop():Vector<T> {
        if (this.length === 0) {
            throw "OutOfBounds";
        } else if (this.length === 1) {
            return <Vector<T>> EMPTY_VECTOR;
        }

        var root = v.pop(this.root, this.shift);

        // the initial special cases mean we cannot be completely empty.
        // but we want a root with more than one (or we can flatten the tree).

        if (root.length === 1) {
            return new Vector<T>(root[0], this.shift - v.BITS, this.length - 1);
        } else {
            return new Vector<T>(root, this.shift, this.length - 1);
        }
    }

    public forEach(fn:(value:T, index:number, vect:any) => any, context:any = null):void {
        var that = this,
            currentIndex = 0,
            scan = function (node:Array<any>, level:number):void {
                if (level === 0) {
                    node.forEach(function (item:T, index:number, arr:any[]):void {
                        fn.call(context, item, currentIndex, that);
                        currentIndex += 1;
                    });
                } else {
                    for (var i=0; i<node.length; i++) {
                        scan(node[i], level - v.BITS);
                    }
                }
            };

        scan(this.root, this.shift);
    }

    public equals(other:any):boolean {
        if (this === other) {
            return true;
        }

        if (other === null || other === undefined || !(other instanceof Vector)) {
            return false;
        }

        if (this.length !== other.length) {
            return false
        }

        var same = true;
        try {
            // TODO PERFORMANCE use internal structure to short-circuit much computation.
            this.forEach((item:T, index:number) => {
                if (!equals(item, other.get(index))) {
                    same = false;
                    throw StopIteration;
                }
            });
        } catch (stop) {
            if (stop !== StopIteration) {
                throw stop;
            }
        }
        return same;
    }

    public filter(fn:(value:T, index:number, vect:any) => boolean, context:any = undefined):Vector<T> {
        // TODO filter should be lazy, and only use a minimum sequence.
        var temp = [];

        this.forEach((item:T, index:number) => {
            if (fn.call(context, item, index, this)) {
                temp.push(item);
            }
        });

        if (temp.length === this.length) {
            return this;
        }

        return Vector.from<T>(temp);
    }

    public find(fn:(value:T, index:number, vect:any) => boolean, context:any = undefined):T {
        var value = undefined;
        this.forEach((item:T, index:number) => {
            if (fn.call(context, item, index, this)) {
                value = item;
            }
        });
        return value;
    }

    public findIndex(fn:(value:T, index:number, vect:any) => boolean, context:any = undefined):number {
        var value = -1;
        this.forEach((item:T, index:number) => {
            if (fn.call(context, item, index, this)) {
                value = index;
            }
        });
        return value;
    }

    // find an item by ===
    public indexOf(search:T):number {
        var value = -1;
        this.forEach((item:T, index:number) => {
            if (item === search) {
                value = index;
            }
        });
        return value;
    }

    // Factory function to create instances from various sources.
    static from<T>(obj?:any):Vector<T> {
        if (obj === null || obj === undefined) {
            return <Vector<T>> EMPTY_VECTOR;
        } else if (obj instanceof Vector) {
            return obj;
        } else if (obj instanceof Array) {
            return Vector.fromArray<T>(obj);
        } else if (typeof obj.forEach === 'function') {
            return Vector.fromArray<T>(obj);
        } else {
            throw "TypeError: unknown source object for vector: " + obj;
        }
    }

    private static fromArray<T>(obj:Array<T>):Vector<T> {
        var result = <Vector<T>> EMPTY_VECTOR;
        // TODO this can be optimised pretty easily.
        for (var i = 0; i < obj.length; i++) {
            result = result.push(obj[i]);
        }
        return result;
    }

    private static fromSeq<T>(seq:Sequence<T>):Vector<T> {
        var result = <Vector<T>> EMPTY_VECTOR;
        // TODO this can be optimised pretty easily.
        seq.forEach(function (item:T) {
            result = result.push(item);
        });

        return result;
    }
}

var EMPTY_VECTOR = new Vector([], 0, 0);

// Classes required to implement vectors.
module v {
    export var BITS = 5,
        WIDTH = 1 << BITS,
        MASK = WIDTH - 1;

    export function rangecheck(index:number, length:number):number {
        if (index < 0) {
            index += length;
        }

        if (index < 0 || index >= length) {
            throw "OutOfBounds";
        }

        return index;
    }

    export function setIndex(node:Array<any>, level:number, index:number, value:any):Array<any> {
        var offset = (index >> level) & MASK;
        if (level === 0) {
            var changed = node.slice(0);
            changed[offset] = value;
            return changed;
        } else {
            var changed = node.slice(0);
            changed[offset] = setIndex((changed.length == offset) ? [] : changed[offset], level - BITS, index, value);
            return changed;
        }
    }

    export function pop(node:Array<any>, level:number):Array<any> {
        // if we return null, that means we are empty and should be completely pruned.
        // The leaf nodes have slightly simpler behaviour: if this is the last node, return null.
        if (level === 0) {
            if (node.length === 1) {
                return null;
            } else {
                return node.slice(0, node.length - 1);
            }
        } else {
            // we are always removing the *last* node in the vector, and by extension the last element
            // in *this* level.
            var offset = node.length - 1,
                popped = pop(node[offset], level - BITS),
                changed;

            if (popped === null) {
                if (offset === 0) {
                    return null;
                } else {
                    // remove the node.
                    return node.slice(0, node.length - 1);
                }
            } else {
                changed = node.slice(0);
                changed[offset] = popped;
                return changed;
            }
        }
    }
}

export module hamt {
    export var BITS = 5,
        WIDTH = 1 << BITS,
        MASK = WIDTH - 1;

    function mask(shift, value) {
        return (value >> shift) & MASK
    }

    export interface HashFn<K> {
        (key:K):number;
    }








    export interface Node<K, T> {
        get(shift:number, hashCode:number, key:K, default_:T):T;
        set(shift:number, hashCode:number, key:K, value:T):Node<K, T>;
        remove(shift:number, hashCode:number, key:K):Node<K, T>;
        forEach(fn:(value:T, key:K, source:any) => any, context:any, source:any):void;
    }

    // A very simple interior node which uses a full array for storin children.
    // Uses the fact that javascript arrays are sparse.  MEASURE then change if it actually
    // makes a space/size/performance difference.
    export class Interior<K, T> implements Node<K, T> {
        constructor(ignore:any, contents:Array<Node<K, T>>) {
            if (ignore !== undefined) {
                throw "TypeError: constructor is private - use the .from methods to create new StringMaps";
            }

            this.contents = contents;
//            freeze(this);
        }

        private contents:Array<Node<K, T>>;

        get(shift:number, hashCode:number, key:K, default_:T):T {
            var index = ((hashCode >> shift) & MASK);

            if (this.contents[index] === undefined) {
                return default_;
            } else {
                return this.contents[index].get(shift + BITS, hashCode, key, default_);
            }
        }

        set(shift:number, hashCode:number, key:K, value:T):Node<K, T> {
            var index = (hashCode >> shift) & MASK;

            if (this.contents[index] === undefined) {
                var changed:Array<Node<K, T>> = this.contents.slice(0);
                changed[index] = new Leaf(undefined, hashCode, key, value);
                return new Interior<K, T>(undefined, changed);
            } else {
                var newchild = this.contents[index].set(shift + BITS, hashCode, key, value);
                if (newchild === this.contents[index]) {
                    return this;
                }
                var changed = this.contents.slice(0);
                changed[index] = newchild;
                return new Interior<K, T>(undefined, changed);
            }
        }

        remove(shift:number, hashCode:number, key:K):Node<K, T> {
            var index = mask(shift, hashCode);

            if (this.contents[index] === undefined) {
                return this;
            } else {
                var newval = this.contents[index].remove(shift + BITS, hashCode, key),
                    changed = this.contents.slice(0),
                    population = 0,
                    instance:Node<K, T> = undefined;

                if (newval === null) {
                    newval = undefined;
                }
                changed[index] = newval;

                // we now check to see if we have a *single* item (or less)
                // since we are using sparse arrays, we have to manually check population.
                for (var i=0; i < changed.length; i++) {
                    if (changed[i] !== undefined) {
                        population += 1;
                        instance = changed[i];
                    }
                }

                if (population === 0) {
                    return null;
                } else if (population === 1 && (instance instanceof Leaf || instance instanceof Collision)) {
                    return instance;
                } else {
                    return new Interior<K, T>(undefined, changed);
                }
            }
        }

        public forEach(fn:(value:T, key:K, source:any) => any, context:any = undefined, source:any = undefined):void {
            var len = this.contents.length;
            for (var i=0; i < len; i++) {
                if (this.contents[i] !== undefined) {
                    this.contents[i].forEach(fn, context, source);
                }
            }
        }
    }

    export class Leaf<K, T> implements Node<K, T> {
        constructor(ignore:any, hashCode:number, key:K, value:T) {
            if (ignore !== undefined) {
                throw "TypeError: constructor is private - use the .from methods to create new StringMaps";
            }
            this.hashCode = hashCode;
            this.key = key;
            this.value = value;
//            freeze(this);
        }

        private hashCode:number;
        private key:K;
        private value:T;

        get(shift:number, hashCode:number, key:K, default_:T):T {
            if (equals(key, this.key)) {
                return this.value;
            }
            return default_;
        }

        set(shift:number, hashCode:number, key:K, value:T):Node<K, T> {
            if (equals(this.key, key)) {
                // replace value.
                if (equals(value, this.value)) {
                    return this;
                } else {
                    // replace ourself
                    return new Leaf<K, T>(undefined, hashCode, key, value);
                }
            } else if (hashCode === this.hashCode) {
                // collision
                return new Collision<K, T>(undefined, this.hashCode, [])
                    .set(shift, this.hashCode, this.key, this.value)
                    .set(shift, hashCode, key, value);
            } else {
                // create a new try, and place our
                var newroot = new Interior<K, T>(undefined, []);
                return newroot
                    .set(shift, this.hashCode, this.key, this.value)
                    .set(shift, hashCode, key, value);
            }
        }

        public remove(shift:number, hashCode:number, key:K):hamt.Node<K, T> {
            // just remove ourselves.
            return null;
        }

        public forEach(fn:(value:T, key:K, source:any) => any, context:any = undefined, source:any = undefined):void {
            fn.call(context, this.value, this.key, source);
        }
    }

    export class Collision<K, T> implements Node<K, T> {
        constructor(ignore:any, hashCode:number, values:Array<any>) {
            this.hashCode = hashCode;
            this.values = values;
//            freeze(this);
        }
        private hashCode:number;
        private values:Array<any>;

        get(shift:number, hashCode:number, key:K, default_:T):T {
            // values is a sequence of key, value, key, value objects.
            for (var i=0; i < this.values.length / 2; i++) {
                if (equals(this.values[2 * i], key)) {
                    return this.values[2 * i+1];
                }
            }
            return default_;
        }

        set(shift:number, hashCode:number, key:any, value:T):Node<K, T> {
            for (var i=0; i < this.values.length / 2; i++) {
                if (equals(this.values[2 * i], key)) {
                    if (equals(this.values[2 * i+1], value)) {
                        return this;
                    }
                    var newvalues = this.values.slice(0);
                    newvalues[i+1] = value;
                    return new Collision<K, T>(undefined, hashCode, newvalues);
                }
            }
            newvalues = this.values.slice(0);
            newvalues.push(key);
            newvalues.push(value);
            return new Collision<K, T>(undefined, hashCode, newvalues);
        }

        public remove(shift:number, hashCode:number, key:K):hamt.Node<K, T> {
            var newvalues = [];
            for (var i = 0; i < this.values.length / 2; i++) {
                if (!equals(this.values[2 * i], key)) {
                    newvalues.push(this.values[2 * i]);
                    newvalues.push(this.values[2 * i + 1]);
                }
            }

            // TODO I'm pretty sure that an empty state is impossible.
            if (newvalues.length == 0) {
                return null;
            } else if (newvalues.length == 2) {
                return new Leaf<K, T>(undefined, hashCode, newvalues[0], newvalues[1]);
            } else {
                return new Collision<K, T>(undefined, hashCode, newvalues);
            }
        }

        public forEach(fn:(value:T, key:K, source:any) => any, context:any = undefined, source:any = undefined):void {
            var len = this.values.length / 2;
            for (var i=0; i < len; i++) {
                fn.call(context, this.values[2 * i], this.values[2 * i + 1], source);
            }
        }
    }
}

// Taken from http://www.cse.yorku.ca/~oz/hash.html
function _stringHash(source:string):number {
    if (source === null || source === undefined) {
        return 0;
    } else if (typeof source !== 'string') {
        throw "TypeError: only strings are supported for hashing.";
    }

    var hash = 0,
        current;

    for (var i = 0; i < source.length; i++) {
        current = source.charCodeAt(i);
        hash = current + (hash << 6) + (hash << 16) - hash;
    }

    return hash;
}

export function hashCode(key:any):number {
    var t = typeof key;

    if (t === 'string') {
        return _stringHash(key);
    } else if (t === 'number') {
        return (key >= 0) ? key : -1 * key;
    } else if (t === 'boolean') {
        return key + 0;
    } else if (key === undefined || key === null) {
        return 0;
    }

    if (typeof key['hashCode'] !== 'function') {
        throw "TypeError: object must support .hashCode to be a member of a hash function."
    }

    var res = key['hashCode']();
    if (typeof res !== 'number') {
        throw "TypeError: hashCode must return a number."
    }
    return res;
}

export class HashMap<K, T> implements Sequence<T>  {
    constructor(ignored:any, hashFn:hamt.HashFn<K>, root:hamt.Node<K, T>) {
        if (ignored !== undefined) {
            throw "TypeError: constructor is private: please use .from to create a new HashMap";
        }
        this.hashFn = hashFn;
        this.root = root;
        freeze(this);
    }

    private hashFn:hamt.HashFn<K>;
    private root:hamt.Node<K, T>;

    public get(key:K, default_?:T):T {
        if (this.root === null) { return default_; }
        return this.root.get(0, this.hashFn(key), key, default_);
    }

    public has(key:K):boolean {
        if (this.root === null) { return false; }
        var NOTFOUND = <T> {}; // cannot be contained by strict equality.
        return (this.root.get(0, this.hashFn(key), key, NOTFOUND) !== NOTFOUND);
    }

    public set(key:K, value:T):HashMap<K, T> {
        var newroot:hamt.Node<K, T>;
        if (this.root === null) {
            newroot = new hamt.Leaf<K, T>(undefined, this.hashFn(key), key, value);
        } else {
            newroot = this.root.set(0, this.hashFn(key), key, value);
        }

        if (newroot === this.root) {
            return this;
        }

        return new HashMap<K, T>(undefined, this.hashFn, newroot);
    }

    public remove(key:K):HashMap<K, T> {
        if (this.root === null) {
            return this;
        }

        var newroot = this.root.remove(0, this.hashFn(key), key);
        if (newroot === this.root) {
            return this;
        }

        return new HashMap<K, T>(undefined, this.hashFn, newroot);
    }

    public forEach(fn:(value:T, key:K, source:HashMap<K, T>) => any, context:any = undefined):void {
        if (this.root === null) {
            return;
        }

        this.root.forEach(fn, context, this);
    }

    public static from<K, T>(hashFn: hamt.HashFn<K>) {
        if (typeof hashFn !== 'function') {
            throw "TypeError: Must provide a hash function to .from";
        }
        return new HashMap(undefined, hashFn, null);
    }

    public equals(other:any):boolean {
        if (this === other) {
            return true;
        }

        if (!(other instanceof HashMap)) {
            return false;
        }

        if (this.hashFn !== other.hashFn) {
            return false;
        }

        // TODO we can go faster than this.
        var diff:boolean = false;
        this.forEach((item:T, key:K) => {
            if (!equals(item, other.get(key))) {
                diff = true;
            }
        });
        other.forEach((item:T, key:K) => {
            if (!equals(item, this.get(key))) {
                diff = true;
            }
        });

        return !diff;
    }
}

export class StringMap<T> implements Sequence<T>  {
    constructor(ignored:any, actual:HashMap<string, T>) {
        if (ignored !== undefined) {
            throw "TypeError: constructor is private - use the .from methods to create new StringMaps";
        }
        this.actual = actual;
        freeze(this);
    }

    private actual:HashMap<string, T>;

    public get(key:string, default_?:T):T {

        return this.actual.get(key, default_);
    }

    public has(key:string):boolean {
        if (this.actual === null) { return false; }
        var NOTFOUND = <T> {}; // cannot be contained by strict equality.
        return (this.actual.get(key, NOTFOUND) !== NOTFOUND);
    }

    public set(key:string, value:T):StringMap<T> {
        var newactual = this.actual.set(key, value);
        if (newactual === this.actual) {
            return this;
        }

        return new StringMap<T>(undefined, newactual);
    }

    public remove(key:string):StringMap<T> {
        var newactual = this.actual.remove(key);
        if (newactual === this.actual) {
            return this;
        }

        return new StringMap<T>(undefined, newactual);
    }

    public static from<T>(sample:StringMap<T>):StringMap<T>;
    public static from<T>(sample:any):StringMap<T>;
    public static from<T>():StringMap<T>; // same as empty.

    public static from<T>(sample?:any):StringMap<T> {
        if (sample === null || sample === undefined) {
            return new StringMap<T>(undefined, new HashMap<string, T>(undefined, _stringHash, null));
        } else if (sample instanceof StringMap) {
            return sample;
        } else {
            // make a new item, and apply all children.
            var hamt = new HashMap<string, T>(undefined, _stringHash, null);
            for (var key in sample) {
                if (Object.hasOwnProperty.call(sample, key)) {
                    hamt = hamt.set(key, sample[key]);
                }
            }
            return new StringMap<T>(undefined, hamt);
        }
    }

    public forEach(fn:(value:T, key:string) => any, context:any):void;
    public forEach(fn:(value:T, key:string) => any):void;

    public forEach(fn:(value:T, key:string) => any, context:any = undefined):void {
        if (this.actual === null) {
            return;
        }

        this.actual.forEach(fn, context);
    }

    public equals(other:any):boolean {
        if (this === other) {
            return true;
        }

        if (!(other instanceof StringMap)) {
            return false;
        }

        return equals(this.actual, other.actual);
    }
}

/**
 * The q module allows you to modify complex persistent structures in a simple way.
 * way.  Key to this is (a) the ability to descend the object tree, and (b) to know how to effect
 * a change.
 */
export module query {
    export interface Path {
        swap<T>(root:T, change:(obj:any) => any):T;
        value(root:any):any;
        replace<T>(root:T, value:any):T;
    }

    /**
     * For a given set of path segments (strings or Swappers)
     * @param parts
     */
    export function path(... parts:any[]):Path {
        var actual:PathSegment[] = [];

        parts.forEach(function (part:any) {
            if (typeof part === 'string') {
                actual.push(prop(part));

            } else if (typeof part.current === 'function' && typeof part.replace === 'function') {
                actual.push(part);
            } else {
                throw "Each part must be a path segment: " + part;
            }
        });

        return new SimplePath(ArrayVector.from<PathSegment>(actual));
    }

    class SimplePath implements Path {
        constructor(inner:ArrayVector<PathSegment>) {
            this.inner = inner;
//            freeze(this);
        }

        public inner:ArrayVector<PathSegment>;

        public swap<T>(root:T, change:(obj:any) => any):T {
            var recurSwap = (idx:number, current:any) => {
                if (idx === this.inner.length) {
                    return change(current);
                } else {
                    var changed = recurSwap(idx + 1, this.inner.get(idx).current(current));
                    return this.inner.get(idx).replace(current, changed);
                }
            };
            return recurSwap(0, root);
        }

        public value(root:any):any {
            var last = root;
            this.inner.forEach((segment:PathSegment) => {
                last = segment.current(last);
            });
            return last;
        }

        public replace<T>(root:T, value:any):T {
            return this.swap(root, function () { return value; });
        }
    }

    export function swap<T>(root:T, pathParts:any[], change:(obj:any) => any):T {
        return path.apply(null, pathParts).swap(root, change);
    }

    export function replace<T>(root:T, pathParts:any[], value:any):T {
        return path.apply(null, pathParts).replace(root, value);
    }

    export function value(root:any, pathParts:any[]):any {
        return path.apply(null, pathParts).value(root);
    }

    /**
     * PathSegment function for a Map or Vector object.  Will inspect the current root and
     * descend based on the provided key.
     */
    export function at(key:any):PathSegment {
        return freeze({
            current: function (root) {
                if (typeof root.get === 'function' && typeof root.set === 'function') {
                    return root.get(key);
                } else {
                    throw "Cannot apply at() to type " + typeof root + ' on ' + root;
                }
            },
            replace: function (root, value) {
                if (typeof root.get === 'function' && typeof root.set === 'function') {
                    return root.set(key, value);
                } else {
                    throw "Cannot apply at() to type " + typeof root + ' on ' + root;
                }
            }
        });
    }

    /**
     * Generate a prop
     * @param propName
     * @returns {PathSegment}
     */
    export function prop(propName:string):PathSegment {
        return freeze({
            current: function (root) {
                if (typeof root.with_ !== 'function') {
                    throw "Can only use prop segments on structs.";
                } else if (!hasProp(root, propName)) {
                    throw "Object does not have property by name of propName";
                }

                return root[propName];
            },
            replace: function (root, value) {
                return root.with_(propName, value);
            }
        });
    }

    export interface PathSegment {
        current(root:any):any;
        replace(root:any, value:any):any;
    }
}
