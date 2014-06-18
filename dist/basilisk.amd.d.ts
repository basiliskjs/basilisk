declare module "basilisk" { export interface Struct {
    /**
    * Given an "example" object, this will create a new object of the same
    * 'type', but with the specified name overridden.
    *
    * @param propName
    * @param propValue
    */
    with_(propName: string, propValue: any): Struct;
}
export interface Sequence<T> {
    forEach(fn: (value: T) => any, context: any): void;
    forEach(fn: (value: T) => any): void;
}
export module ts {
    /**
    * A Typescript-specific implementation of Struct, which makes writing new
    * Structs easy.
    */
    class Struct {
        constructor();
        /**
        * Return a new instance of this structure, replacing the named property with
        * the provided value.
        *
        * @param propName the property to replace.
        * @param propValue the value to replace.
        */
        public with_(propName: string, propValue: any): Struct;
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
export function equals(a: any, b: any): boolean;
/**
* Given a list of strings, create constructor function which will create instances of the
* named 'class'.
*
* An 'equals' method is added to every struct, which will apply a basilisk-equality check to each
* property in turn to determine equality.
*/
export function makeStruct(baseProps: string[]): (opts: any) => void;
/**
* A basic persistent vector class.  This is *not* backed by a complex datastructure, and will
* perform very badly for non-trivial data sizes.
*/
export class ArrayVector<T> implements Sequence<T> {
    constructor(ignored: any, ref: T[]);
    static from<T>(sample: ArrayVector<T>): ArrayVector<T>;
    static from<T>(sample: T[]): ArrayVector<T>;
    static from<T>(sample: Sequence<T>): ArrayVector<T>;
    private instance;
    public length: number;
    public append(value: T): ArrayVector<T>;
    /**
    * Retrieve the object at a particular index. Raises
    */
    public get(index: number): T;
    /**
    * Create a new vector, with the specified index replaced within the object.
    */
    public set(index: number, value: T): ArrayVector<T>;
    public forEach(fn: (value: T, index: number, vect: any) => any, context?: any): void;
    public filter(fn: (value: T, index: number, vect: any) => boolean, context?: any): Sequence<T>;
    public find(fn: (value: T, index: number, vect: any) => boolean, context?: any): T;
    public equals(other: any): boolean;
}
/**
* A Simple StringMap which can store any object, keyed on a string.
*
* This implementation is convenient when working on the console, but should not be used for more than 40-50 items.
*/
export class SimpleStringMap<T> implements Sequence<T> {
    constructor(ignore: any, inst: any);
    static from<T>(sample: SimpleStringMap<T>): any;
    static from<T>(sample: any): any;
    private instance;
    public get(key: string, default_?: T): T;
    public set(key: string, value: T): SimpleStringMap<T>;
    public has(key: string): boolean;
    public remove(key: string): SimpleStringMap<T>;
    public forEach(fn: (value: T, key: string, source: any) => any, context?: any): void;
    public equals(other: any): boolean;
}
export class Vector<T> implements Sequence<T> {
    constructor(root: any[], shift: number, length: number);
    public length: number;
    private root;
    private shift;
    public get(index: number): T;
    public peek(): T;
    public set(index: number, value: T): Vector<T>;
    public push(value: T): Vector<T>;
    public pop(): Vector<T>;
    public forEach(fn: (value: T, index: number, vect: any) => any, context?: any): void;
    public equals(other: any): boolean;
    public filter(fn: (value: T, index: number, vect: any) => boolean, context?: any): Vector<T>;
    public find(fn: (value: T, index: number, vect: any) => boolean, context?: any): T;
    public findIndex(fn: (value: T, index: number, vect: any) => boolean, context?: any): number;
    public indexOf(search: T): number;
    static from<T>(obj?: any): Vector<T>;
    private static fromArray<T>(obj);
    private static fromSeq<T>(seq);
}
export module hamt {
    var BITS: number, WIDTH: number, MASK: number;
    interface HashFn<K> {
        (key: K): number;
    }
    interface Node<K, T> {
        get(shift: number, hashCode: number, key: K, default_: T): T;
        set(shift: number, hashCode: number, key: K, value: T): Node<K, T>;
        remove(shift: number, hashCode: number, key: K): Node<K, T>;
        forEach(fn: (value: T, key: K, source: any) => any, context: any, source: any): void;
    }
    class Interior<K, T> implements Node<K, T> {
        constructor(ignore: any, contents: Node<K, T>[]);
        private contents;
        public get(shift: number, hashCode: number, key: K, default_: T): T;
        public set(shift: number, hashCode: number, key: K, value: T): Node<K, T>;
        public remove(shift: number, hashCode: number, key: K): Node<K, T>;
        public forEach(fn: (value: T, key: K, source: any) => any, context?: any, source?: any): void;
    }
    class Leaf<K, T> implements Node<K, T> {
        constructor(ignore: any, hashCode: number, key: K, value: T);
        private hashCode;
        private key;
        private value;
        public get(shift: number, hashCode: number, key: K, default_: T): T;
        public set(shift: number, hashCode: number, key: K, value: T): Node<K, T>;
        public remove(shift: number, hashCode: number, key: K): Node<K, T>;
        public forEach(fn: (value: T, key: K, source: any) => any, context?: any, source?: any): void;
    }
    class Collision<K, T> implements Node<K, T> {
        constructor(ignore: any, hashCode: number, values: any[]);
        private hashCode;
        private values;
        public get(shift: number, hashCode: number, key: K, default_: T): T;
        public set(shift: number, hashCode: number, key: any, value: T): Node<K, T>;
        public remove(shift: number, hashCode: number, key: K): Node<K, T>;
        public forEach(fn: (value: T, key: K, source: any) => any, context?: any, source?: any): void;
    }
}
export function hashCode(key: any): number;
export class HashMap<K, T> implements Sequence<T> {
    constructor(ignored: any, hashFn: hamt.HashFn<K>, root: hamt.Node<K, T>);
    private hashFn;
    private root;
    public get(key: K, default_?: T): T;
    public has(key: K): boolean;
    public set(key: K, value: T): HashMap<K, T>;
    public remove(key: K): HashMap<K, T>;
    public forEach(fn: (value: T, key: K, source: HashMap<K, T>) => any, context?: any): void;
    static from<K, T>(hashFn: hamt.HashFn<K>): HashMap<K, {}>;
    public equals(other: any): boolean;
}
export class StringMap<T> implements Sequence<T> {
    constructor(ignored: any, actual: HashMap<string, T>);
    private actual;
    public get(key: string, default_?: T): T;
    public has(key: string): boolean;
    public set(key: string, value: T): StringMap<T>;
    public remove(key: string): StringMap<T>;
    static from<T>(sample: StringMap<T>): StringMap<T>;
    static from<T>(sample: any): StringMap<T>;
    static from<T>(): StringMap<T>;
    public forEach(fn: (value: T, key: string) => any, context: any): void;
    public forEach(fn: (value: T, key: string) => any): void;
    public equals(other: any): boolean;
}
/**
* The q module allows you to modify complex persistent structures in a simple way.
* way.  Key to this is (a) the ability to descend the object tree, and (b) to know how to effect
* a change.
*/
export module query {
    interface Path {
        swap<T>(root: T, change: (obj: any) => any): T;
        value(root: any): any;
        replace<T>(root: T, value: any): T;
    }
    /**
    * For a given set of path segments (strings or Swappers)
    * @param parts
    */
    function path(...parts: any[]): Path;
    function swap<T>(root: T, pathParts: any[], change: (obj: any) => any): T;
    function replace<T>(root: T, pathParts: any[], value: any): T;
    function value(root: any, pathParts: any[]): any;
    /**
    * PathSegment function for a Map or Vector object.  Will inspect the current root and
    * descend based on the provided key.
    */
    function at(key: any): PathSegment;
    /**
    * Generate a prop
    * @param propName
    * @returns {PathSegment}
    */
    function prop(propName: string): PathSegment;
    interface PathSegment {
        current(root: any): any;
        replace(root: any, value: any): any;
    }
}
}