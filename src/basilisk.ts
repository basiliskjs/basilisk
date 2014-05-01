/**
 * Basilisk is a library for working with immutable data in Javascript or
 * related languages.
 */

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
 * named 'class'.  By default, an 'equals' method is created which checks each property using
 * the basilisk.equals method, so that nested structs can easily be checked for logical equality.
 *
 * No property name can start with '__' or be 'with_', to avoid clashes with the basic functionality.
 *
 * @param baseProps a list of
 * @param includeEquals
 * @returns { new(opts:any); with_(propName:string, propVal:any):Struct; }
 */
export function makestruct(baseProps:Array<string>, includeEquals:boolean = true) {
    var props = baseProps.slice();

    for (var i =0; i<props.length; i++) {
        if (props[i].slice(0, 2) === '__') {
            throw "Properties of structs cannot start with __, to prevent collision with __proto__ and other core object behaviours.";
        } else if (props[i] === 'with_') {
            throw "Structs cannot have a 'with_' property, since that collides with the change protocol.";
        } else if (includeEquals && props[i] == 'equals') {
            throw "Structs with an equality property cannot have "
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

    if (includeEquals) {
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
    }

    return Constructor;
}

/**
 * A basic persistent vector class.  This is *not* backed by a complex datastructure, and will
 * perform very badly for non-trivial data sizes.
 */
export class Vector<T> {
    // @private
    constructor(ignored:any, ref:Array<T>) {
        if (ignored !== undefined) {
            throw "TypeError: Vector constructor is private: please use Vector.from()";
        }

        this.instance = ref;
        this.length = this.instance.length;

        freeze(this.instance);
        freeze(this);
    }

    public static from<T>(sample:Vector<T>):Vector<T>;
    public static from<T>(sample:Array<T>):Vector<T>;

    public static from<T>(sample:any):Vector<T> {
        var ref:Array<T>;

        if (sample == null) {
            ref = freeze([]);
        } else if (sample instanceof Vector) {
            return sample;
        } else if (typeof sample.forEach == 'function') {
            ref = [];
            sample.forEach(function (val:T) {
                ref.push(val);
            });
            freeze(ref);
        }
        return new Vector(undefined, ref);
    }

    private instance:Array<T>;
    public length:number;

    public append(value:T):Vector<T> {
        var copy = this.instance.slice();
        copy.push(value);
        return new Vector<T>(undefined, freeze(copy));
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
    public set(index:number, value:T):Vector<T> {
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
        return new Vector<T>(undefined, freeze(adjusted));
    }

    public forEach(fn:(value:T, index:number, vect:Vector<T>) => any, context:any = null):void {
        for (var i=0; i < this.instance.length; i++) {
            fn.call(context, this.instance[i], i, this);
        }
    }

    public filter(fn:(value:T, index:number, vect:Vector<T>) => boolean, context:any = null):Vector<T> {
        var replacement = [];
        for (var i=0; i < this.instance.length; i++) {
            if (fn.call(context, this.instance[i], i, this)) {
                replacement.push(this.instance[i]);
            }
        }
        return new Vector<T>(undefined, freeze(replacement));
    }

    public find(fn:(value:T, index:number, vect:Vector<T>) => boolean, context:any = null):T {
        for (var i=0; i < this.instance.length; i++) {
            if (fn.call(context, this.instance[i], i, this)) {
                return this.instance[i];
            }
        }
        return null;
    }

    // We cannot specialise sufficiently based on the function provided, so we help in the common case.
    public map(fn:(value:T, index:number, vect:Vector<T>) => T, context:any):Vector<T>;
    public map(fn:(value:T, index:number, vect:Vector<T>) => T):Vector<T>;
    public map<T2>(fn:(value:T, index:number, vect:Vector<T>) => T2, context:any):Vector<T2>;
    public map<T2>(fn:(value:T, index:number, vect:Vector<T>) => T2):Vector<T2>;

    public map(fn:(value:T, index:number, vect:Vector<T>) => any, context:any = null):Vector<any> {
        var replacement = [];
        for (var i=0; i < this.instance.length; i++) {
            replacement.push(fn.call(context, this.instance[i], i, this));
        }
        return new Vector<T>(undefined, freeze(replacement));
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
 * A persistent StringMap which can store any object, keyed on a string.
 *
 * The current implementation has had NO performance work done to it: it exists only to demonstrate
 * the underlying API.
 */
export class StringMap<T> {
    // @private
    constructor(inst:any = undefined) {
        this.instance = inst;
        freeze(this);
    }

    public static from<T>(sample:StringMap<T>);
    public static from<T>(sample:any);

    public static from<T>(sample:any) {
        var inst = {};

        if (sample !== null && sample !== undefined) {
            if (sample instanceof StringMap) {
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

        return new StringMap(inst);
    }

    private instance:Object;

    public get(key:string, default_:T = null):T {
        var actualKey:string = sm.convertKey(key);

        if (hasProp(this.instance, actualKey)) {
            return this.instance[actualKey];
        }
        return default_;
    }

    public set(key:string, value:T):StringMap<T> {
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
        return new StringMap<T>(altered);
    }

    public has(key:string):boolean {
        return hasProp(this.instance, sm.convertKey(key));
    }

    public remove(key:string):StringMap<T> {
        var altered = {},
            actualKey = sm.convertKey(key);

        for (var prop in this.instance) {
            if (hasProp(this.instance, prop)) {
                if (prop !== actualKey) {
                    altered[prop] = this.instance[prop];
                }
            }
        }

        return new StringMap<T>(altered);
    }

    public forEach(fn:(value:T, key:string, map:StringMap<T>) => any, context:any = undefined):void {
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

/**
 * The q module allows you to modify complex persistent structures in a simple way.
 * way.  Key to this is (a) the ability to descend the object tree, and (b) to know how to effect
 * a change.
 */
export module q {
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

        return new SimplePath(Vector.from<PathSegment>(freeze(actual)));
    }

    class SimplePath implements Path {
        constructor(inner:Vector<PathSegment>) {
            this.inner = inner;
            freeze(this);
        }

        public inner:Vector<PathSegment>;

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

    /**
     * PathSegment function for a StringMap or Vector object.  Will inspect the current root and
     * descend based on the provided key.
     */
    export function at(key:string):PathSegment;
    export function at(key:number):PathSegment;

    export function at(key:any):PathSegment {
        return freeze({
            current: function (root) {
                if (root instanceof Vector || root instanceof StringMap) {
                    return root.get(key);
                } else if (typeof root.get === 'function' && typeof root.set === 'function') {
                    return root.get(key);
                } else {
                    throw "Cannot apply at() to type " + typeof root + ' on ' + root;
                }
            },
            replace: function (root, value) {
                if (root instanceof Vector || root instanceof StringMap) {
                    return root.set(key, value);
                } else if (typeof root.get === 'function' && typeof root.set === 'function') {
                    return root.get(key);
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

// internal shims for a few es5 functions which we cannot reasonably expect people to shim.
var freeze = (obj:any):any => { return (Object.freeze) ? Object.freeze(obj) : obj; },
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
