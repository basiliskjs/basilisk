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
            Object.freeze(this);
        }

        /**
         * Return a new instance of this structure, replacing the named property with
         * the provided value.
         *
         * @param propName the property to replace.
         * @param propValue the value to replace.
         */
        public with_(propName:string, propValue:any):Struct {
            var altered = {};
            for (var prop in this) {
                if (this.hasOwnProperty(prop)) {
                    altered[prop] = this[prop];
                }
            }
            altered[propName] = propValue;
            return new (Object.getPrototypeOf(this).constructor)(altered);
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
        Object.freeze(this);
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
            if (Object.getPrototypeOf(this) === Object.getPrototypeOf(other)) {
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
    constructor(sample:Vector<T>)
    constructor(sample:Array<T>)

    constructor(sample:any = null) {
        var ref:Array<T>;

        if (sample == null) {
            ref = [];
        } else if (sample instanceof Vector) {
            ref = (<Vector<T>> sample).instance;
        } else if (typeof sample.forEach == 'function') {
            ref = [];
            sample.forEach(function (val:T) {
                ref.push(val);
            });
        }
        this.instance = ref;

        this.length = this.instance.length;

        Object.freeze(this.instance);
        Object.freeze(this);
    }

    private instance:Array<T>;

    public length:number;

    public append(value:T):Vector<T> {
        var copy = this.instance.slice();
        copy.push(value);
        return new Vector<T>(copy);
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
        return new Vector<T>(adjusted);
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
        return new Vector<T>(replacement);
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
    public map(fn:(value:T, index:number, vect:Vector<T>) => T, context:any):Vector<T>
    public map(fn:(value:T, index:number, vect:Vector<T>) => T):Vector<T>
    public map<T2>(fn:(value:T, index:number, vect:Vector<T>) => T2, context:any):Vector<T2>
    public map<T2>(fn:(value:T, index:number, vect:Vector<T>) => T2):Vector<T2>

    public map(fn:(value:T, index:number, vect:Vector<T>) => any, context:any = null):Vector<any> {
        var replacement = [];
        for (var i=0; i < this.instance.length; i++) {
            replacement.push(fn.call(context, this.instance[i], i, this));
        }
        return new Vector<T>(replacement);
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
        if (Object.getPrototypeOf(this) === Object.getPrototypeOf(other)) {
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
    constructor(sample:StringMap<T>)
    constructor(sample:any)
    // @private a (to-be-deprecated) internal-use constructor which makes a StringMap out of
    // a constructor.
    constructor(sample:any, rawInstance:any)
    constructor()

    constructor(sample?:StringMap<T>, cloneable:any = undefined) {
        var inst = {};

        if ((sample === null || sample === undefined) && cloneable !== undefined) {
            inst = cloneable;
        } else if (sample !== null && sample !== undefined) {
            if (Object.getPrototypeOf(sample) === Object.getPrototypeOf(this)) {
                inst = sample.instance;
            } else {
                for (var k in sample) {
                    if (sample.hasOwnProperty(k)) {
                        inst[this.convertKey(k)] = sample[k];
                    }
                }
            }
        }

        Object.freeze(inst);
        this.instance = inst;
        Object.freeze(this);
    }

    private instance:Object;

    public get(key:string, default_:T = null):T {
        var actualKey:string = this.convertKey(key);

        if (this.instance.hasOwnProperty(actualKey)) {
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
            if (this.instance.hasOwnProperty(prop)) {
                altered[prop] = this.instance[prop];
            }
        }
        altered[this.convertKey(key)] = value;

        // Cheat, knowing that we will use the "instance" property.
        return new StringMap<T>(null, altered);
    }

    public has(key:string):boolean {
        return this.instance.hasOwnProperty(this.convertKey(key));
    }

    public remove(key:string):StringMap<T> {
        var altered = {},
            actualKey = this.convertKey(key);

        for (var prop in this.instance) {
            if (this.instance.hasOwnProperty(prop)) {
                if (prop !== actualKey) {
                    altered[prop] = this.instance[prop];
                }
            }
        }

        return new StringMap<T>(null, altered);
    }

    public forEach(fn:(value:T, key:string, map:StringMap<T>) => any, context:any = undefined):void {
        for (var prop in this.instance) {
            if (this.instance.hasOwnProperty(prop)) {
                fn.call(context, this.instance[prop], this.reverseKey(prop), this);
            }
        }
    }

    // we cannot directly store strings in the map, without first mangling them.
    // otherwise, a string of __proto__ could horribly break the object.
    //
    // we mangle at the end, because i *assume* that prefixes are quick to check.
    private convertKey(key:string):string { return key + '___'; }
    private reverseKey(key:string):string { return key.substr(0, key.length - 3); }

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

/**
 * The q module allows you to modify complex persistent structures in a fairly simple-to-understand
 * way.  Key to this is (a) the ability to descend the object tree, and (b) to know how to effect
 * a change.
 *
 * EXPERIIMENTAL: The API for the Q module is **very** likely to change.
 */
export module q {
    export function swap(root:any, path:any[], change:(obj:any) => any):any {
        if (path.length === 0) {
            return change(root);
        }

        // path must be longer than one: our task is to identify how to step one deeper, and apply
        // the result to that item.
        var step = path[0];

        if (typeof step === 'string') {
            // root should be a struct.
            if (typeof root.with_ !== 'function') {
                throw "String path step requires a struct - must have with_ - is " + (typeof root.with_);
            }

            return root.with_(step, swap(root[step], path.slice(1), change));
        } else if (typeof step === typeof {}) {
            if (typeof step.current !== 'function' || typeof step.replace !== 'function') {
                throw "Objects in the path must have 'current' and 'replace' functions.";
            }

            var updated = swap(step.current(root), path.slice(1), change);
            return step.replace(root, updated);
        }

        throw "Cannot use path step: " + step;
    }

    /**
     * Swapper function for a StringMap or Vector object.  Will inspect
     */
    export function at(key:any):Swapper {
        return {
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
        };
    }



    export interface Swapper {
        current(root:any):any;
        replace(root:any, value:any):any;
    }
}