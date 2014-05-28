(function(root, factory) {
if(typeof exports === 'object') {
module.exports = factory(require, exports, module);
}
else if(typeof define === 'function' && define.amd) {
define(['require', 'exports', 'module'], factory);
}
else {
var req = function(id) {return root[id];},
exp = {},
mod = {exports: exp};
root['basilisk'] = factory(req, exp, mod);
}
}(this, function(require, exports, module) {
  /**
  * Basilisk is a library for working with immutable data in Javascript or
  * related languages.
  */
  // internal shims for a few es5 functions which we cannot reasonably expect people to shim.
  var freeze = (Object.freeze) ? function (obj) {
      return Object.freeze(obj);
  } : function (obj) {
      return obj;
  }, hasProp = function (obj, prop) {
      return Object.hasOwnProperty.call(obj, prop);
  }, sameType = function (a, b) {
      if (a === null || b === null || a === undefined || b === undefined) {
          return false;
      }

      if (a.constructor === undefined || b.constructor === undefined) {
          return false;
      }

      return a.constructor === b.constructor;
  };

  (function (ts) {
      /**
      * A Typescript-specific implementation of Struct, which makes writing new
      * Structs easy.
      */
      var Struct = (function () {
          function Struct() {
              freeze(this);
          }
          /**
          * Return a new instance of this structure, replacing the named property with
          * the provided value.
          *
          * @param propName the property to replace.
          * @param propValue the value to replace.
          */
          Struct.prototype.with_ = function (propName, propValue) {
              var altered = {}, Maker = this.constructor;
              for (var prop in this) {
                  if (hasProp(this, prop)) {
                      altered[prop] = this[prop];
                  }
              }
              altered[propName] = propValue;
              return new Maker(altered);
          };
          return Struct;
      })();
      ts.Struct = Struct;
  })(exports.ts || (exports.ts = {}));
  var ts = exports.ts;

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
  function equals(a, b) {
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
  exports.equals = equals;

  /**
  * Given a list of strings, create constructor function which will create instances of the
  * named 'class'.
  *
  * An 'equals' method is added to every struct, which will apply a basilisk-equality check to each
  * property in turn to determine equality.
  */
  function makeStruct(baseProps) {
      var props = baseProps.slice();

      for (var i = 0; i < props.length; i++) {
          if (props[i].slice(0, 2) === '__') {
              throw "Properties of structs cannot start with __, to prevent collision with __proto__ and other core object behaviours.";
          } else if (props[i] === 'with_') {
              throw "Structs cannot have a 'with_' property, since that collides with the change protocol.";
          } else if (props[i] == 'equals') {
              throw "Structs cannot have an 'equals' method.";
          }
      }

      var Constructor = function (opts) {
          for (var i = 0; i < props.length; i++) {
              this[props[i]] = opts[props[i]];
          }
          freeze(this);
      };

      for (i = 0; i < props.length; i++) {
          Constructor.prototype[props[i]] = null;
      }

      Constructor.prototype.with_ = function (propName, propVal) {
          var altered = {}, found = false;

          if (this[propName] === propVal) {
              return this;
          }

          for (var i = 0; i < props.length; i++) {
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
              for (var i = 0; i < baseProps.length; i++) {
                  if (!exports.equals(this[baseProps[i]], other[baseProps[i]])) {
                      return false;
                  }
              }

              // no properties were not equal, thus we must be true.
              return true;
          } else {
              // since we have different prototypes, we must be different objects.
              return false;
          }
      };

      return Constructor;
  }
  exports.makeStruct = makeStruct;

  /**
  * A basic persistent vector class.  This is *not* backed by a complex datastructure, and will
  * perform very badly for non-trivial data sizes.
  */
  var ArrayVector = (function () {
      // @private
      function ArrayVector(ignored, ref) {
          if (ignored !== undefined) {
              throw "TypeError: Vector constructor is private: please use Vector.from()";
          }

          this.instance = ref;
          this.length = this.instance.length;

          freeze(this);
      }
      ArrayVector.from = function (sample) {
          var ref;

          if (sample == null) {
              ref = [];
          } else if (sample instanceof ArrayVector) {
              return sample;
          } else if (typeof sample.forEach == 'function') {
              ref = [];
              sample.forEach(function (val) {
                  ref.push(val);
              });
          }
          return new ArrayVector(undefined, ref);
      };

      ArrayVector.prototype.append = function (value) {
          var copy = this.instance.slice(0);
          copy.push(value);
          return new ArrayVector(undefined, copy);
      };

      /**
      * Retrieve the object at a particular index. Raises
      */
      ArrayVector.prototype.get = function (index) {
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
      };

      /**
      * Create a new vector, with the specified index replaced within the object.
      */
      ArrayVector.prototype.set = function (index, value) {
          // this will check that we have been indexed by a number.
          if (exports.equals(this.get(index), value)) {
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
          return new ArrayVector(undefined, adjusted);
      };

      ArrayVector.prototype.forEach = function (fn, context) {
          if (typeof context === "undefined") { context = null; }
          for (var i = 0; i < this.instance.length; i++) {
              fn.call(context, this.instance[i], i, this);
          }
      };

      ArrayVector.prototype.filter = function (fn, context) {
          if (typeof context === "undefined") { context = null; }
          var replacement = [];
          for (var i = 0; i < this.instance.length; i++) {
              if (fn.call(context, this.instance[i], i, this)) {
                  replacement.push(this.instance[i]);
              }
          }
          return new ArrayVector(undefined, replacement);
      };

      ArrayVector.prototype.find = function (fn, context) {
          if (typeof context === "undefined") { context = null; }
          for (var i = 0; i < this.instance.length; i++) {
              if (fn.call(context, this.instance[i], i, this)) {
                  return this.instance[i];
              }
          }
          return undefined;
      };

      ArrayVector.prototype.equals = function (other) {
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
              for (var i = 0; i < this.instance.length; i++) {
                  if (!exports.equals(other.instance[i], this.instance[i])) {
                      return false;
                  }
              }
          }

          return true;
      };
      return ArrayVector;
  })();
  exports.ArrayVector = ArrayVector;

  /**
  * A Simple StringMap which can store any object, keyed on a string.
  *
  * This implementation is convenient when working on the console, but should not be used for more than 40-50 items.
  */
  var SimpleStringMap = (function () {
      // @private
      function SimpleStringMap(ignore, inst) {
          if (ignore !== undefined) {
              throw "TypeError: StringMap constructor is private - use .from() to create new instances.";
          }
          this.instance = inst;
          freeze(this);
      }
      SimpleStringMap.from = function (sample) {
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
      };

      SimpleStringMap.prototype.get = function (key, default_) {
          if (typeof default_ === "undefined") { default_ = null; }
          var actualKey = sm.convertKey(key);

          if (hasProp(this.instance, actualKey)) {
              return this.instance[actualKey];
          }
          return default_;
      };

      SimpleStringMap.prototype.set = function (key, value) {
          var altered = {};
          if (exports.equals(this.get(key), value)) {
              return this;
          }
          for (var prop in this.instance) {
              if (hasProp(this.instance, prop)) {
                  altered[prop] = this.instance[prop];
              }
          }
          altered[sm.convertKey(key)] = value;

          // Cheat, knowing that we will use the "instance" property.
          return new SimpleStringMap(undefined, altered);
      };

      SimpleStringMap.prototype.has = function (key) {
          return hasProp(this.instance, sm.convertKey(key));
      };

      SimpleStringMap.prototype.remove = function (key) {
          var altered = {}, actualKey = sm.convertKey(key);

          for (var prop in this.instance) {
              if (hasProp(this.instance, prop)) {
                  if (prop !== actualKey) {
                      altered[prop] = this.instance[prop];
                  }
              }
          }

          return new SimpleStringMap(undefined, altered);
      };

      SimpleStringMap.prototype.forEach = function (fn, context) {
          if (typeof context === "undefined") { context = undefined; }
          for (var prop in this.instance) {
              if (hasProp(this.instance, prop)) {
                  fn.call(context, this.instance[prop], sm.reverseKey(prop), this);
              }
          }
      };

      // Equality for StringMaps is defined as being a StringMap with the same keys, and for each
      // key the value must be equals().
      SimpleStringMap.prototype.equals = function (other) {
          if (this === other) {
              return true;
          }

          if (Object.getPrototypeOf(this) !== Object.getPrototypeOf(other)) {
              return false;
          }

          for (var prop in this.instance) {
              if (this.instance.hasOwnProperty(prop)) {
                  if (!exports.equals(this.instance[prop], other.instance[prop])) {
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
      };
      return SimpleStringMap;
  })();
  exports.SimpleStringMap = SimpleStringMap;

  // private utilities for the StringMap implementation.
  var sm;
  (function (sm) {
      function convertKey(key) {
          return key + '___';
      }
      sm.convertKey = convertKey;
      function reverseKey(key) {
          return key.substr(0, key.length - 3);
      }
      sm.reverseKey = reverseKey;
  })(sm || (sm = {}));

  var Vector = (function () {
      function Vector(root, shift, length) {
          this.root = root;
          this.shift = shift;
          this.length = length;

          freeze(this);
      }
      Vector.prototype.get = function (index) {
          index = v.rangecheck(index, this.length);

          var node = this.root;
          for (var level = this.shift; level > 0; level -= v.BITS) {
              node = node[(index >> level) & v.MASK];
          }

          return node[(index >> level) & v.MASK];
      };

      Vector.prototype.peek = function () {
          return this.get(this.length - 1);
      };

      Vector.prototype.set = function (index, value) {
          index = v.rangecheck(index, this.length);

          var root = v.setIndex(this.root, this.shift, index, value);

          return new Vector(root, this.shift, this.length);
      };

      Vector.prototype.push = function (value) {
          var index = this.length;

          var root, shift = this.shift;

          // in the case that the root is full, we add an extra root.
          if (this.root.length === v.WIDTH) {
              shift = this.shift + v.BITS;
              root = v.setIndex([this.root], shift, index, value);
              root = root;
          } else {
              root = v.setIndex(this.root, shift, index, value);
          }

          return new Vector(root, shift, this.length + 1);
      };

      Vector.prototype.pop = function () {
          if (this.length === 0) {
              throw "OutOfBounds";
          } else if (this.length === 1) {
              return EMPTY_VECTOR;
          }

          var root = v.pop(this.root, this.shift);

          // the initial special cases mean we cannot be completely empty.
          // but we want a root with more than one (or we can flatten the tree).
          if (root.length === 1) {
              return new Vector(root[0], this.shift - v.BITS, this.length - 1);
          } else {
              return new Vector(root, this.shift, this.length - 1);
          }
      };

      Vector.prototype.forEach = function (fn, context) {
          if (typeof context === "undefined") { context = null; }
          var that = this, currentIndex = 0, scan = function (node, level) {
              if (level === 0) {
                  node.forEach(function (item, index, arr) {
                      fn.call(context, item, currentIndex, that);
                      currentIndex += 1;
                  });
              } else {
                  for (var i = 0; i < node.length; i++) {
                      scan(node[i], level - v.BITS);
                  }
              }
          };

          scan(this.root, this.shift);
      };

      Vector.prototype.equals = function (other) {
          if (this === other) {
              return true;
          }

          if (other === null || other === undefined || !(other instanceof Vector)) {
              return false;
          }

          if (this.length !== other.length) {
              return false;
          }

          var same = true;
          try  {
              // TODO PERFORMANCE use internal structure to short-circuit much computation.
              this.forEach(function (item, index) {
                  if (!exports.equals(item, other.get(index))) {
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
      };

      Vector.prototype.filter = function (fn, context) {
          var _this = this;
          if (typeof context === "undefined") { context = undefined; }
          // TODO filter should be lazy, and only use a minimum sequence.
          var temp = [];

          this.forEach(function (item, index) {
              if (fn.call(context, item, index, _this)) {
                  temp.push(item);
              }
          });

          if (temp.length === this.length) {
              return this;
          }

          return Vector.from(temp);
      };

      Vector.prototype.find = function (fn, context) {
          var _this = this;
          if (typeof context === "undefined") { context = undefined; }
          var value = undefined;
          this.forEach(function (item, index) {
              if (fn.call(context, item, index, _this)) {
                  value = item;
              }
          });
          return value;
      };

      Vector.prototype.findIndex = function (fn, context) {
          var _this = this;
          if (typeof context === "undefined") { context = undefined; }
          var value = -1;
          this.forEach(function (item, index) {
              if (fn.call(context, item, index, _this)) {
                  value = index;
              }
          });
          return value;
      };

      // find an item by ===
      Vector.prototype.indexOf = function (search) {
          var value = -1;
          this.forEach(function (item, index) {
              if (item === search) {
                  value = index;
              }
          });
          return value;
      };

      // Factory function to create instances from various sources.
      Vector.from = function (obj) {
          if (obj === null || obj === undefined) {
              return EMPTY_VECTOR;
          } else if (obj instanceof Vector) {
              return obj;
          } else if (obj instanceof Array) {
              return Vector.fromArray(obj);
          } else if (typeof obj.forEach === 'function') {
              return Vector.fromArray(obj);
          } else {
              throw "TypeError: unknown source object for vector: " + obj;
          }
      };

      Vector.fromArray = function (obj) {
          var result = EMPTY_VECTOR;

          for (var i = 0; i < obj.length; i++) {
              result = result.push(obj[i]);
          }
          return result;
      };

      Vector.fromSeq = function (seq) {
          var result = EMPTY_VECTOR;

          // TODO this can be optimised pretty easily.
          seq.forEach(function (item) {
              result = result.push(item);
          });

          return result;
      };
      return Vector;
  })();
  exports.Vector = Vector;

  var EMPTY_VECTOR = new Vector([], 0, 0);

  // Classes required to implement vectors.
  var v;
  (function (v) {
      v.BITS = 5, v.WIDTH = 1 << v.BITS, v.MASK = v.WIDTH - 1;

      function rangecheck(index, length) {
          if (index < 0) {
              index += length;
          }

          if (index < 0 || index >= length) {
              throw "OutOfBounds";
          }

          return index;
      }
      v.rangecheck = rangecheck;

      function setIndex(node, level, index, value) {
          var offset = (index >> level) & v.MASK;
          if (level === 0) {
              var changed = node.slice(0);
              changed[offset] = value;
              return changed;
          } else {
              var changed = node.slice(0);
              changed[offset] = setIndex((changed.length == offset) ? [] : changed[offset], level - v.BITS, index, value);
              return changed;
          }
      }
      v.setIndex = setIndex;

      function pop(node, level) {
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
              var offset = node.length - 1, popped = pop(node[offset], level - v.BITS), changed;

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
      v.pop = pop;
  })(v || (v = {}));

  (function (hamt) {
      hamt.BITS = 5, hamt.WIDTH = 1 << hamt.BITS, hamt.MASK = hamt.WIDTH - 1;

      function mask(shift, value) {
          return (value >> shift) & hamt.MASK;
      }

      // A very simple interior node which uses a full array for storin children.
      // Uses the fact that javascript arrays are sparse.  MEASURE then change if it actually
      // makes a space/size/performance difference.
      var Interior = (function () {
          function Interior(ignore, contents) {
              if (ignore !== undefined) {
                  throw "TypeError: constructor is private - use the .from methods to create new StringMaps";
              }

              this.contents = contents;
              //            freeze(this);
          }
          Interior.prototype.get = function (shift, hashCode, key, default_) {
              var index = ((hashCode >> shift) & hamt.MASK);

              if (this.contents[index] === undefined) {
                  return default_;
              } else {
                  return this.contents[index].get(shift + hamt.BITS, hashCode, key, default_);
              }
          };

          Interior.prototype.set = function (shift, hashCode, key, value) {
              var index = (hashCode >> shift) & hamt.MASK;

              if (this.contents[index] === undefined) {
                  var changed = this.contents.slice(0);
                  changed[index] = new Leaf(undefined, hashCode, key, value);
                  return new Interior(undefined, changed);
              } else {
                  var newchild = this.contents[index].set(shift + hamt.BITS, hashCode, key, value);
                  if (newchild === this.contents[index]) {
                      return this;
                  }
                  var changed = this.contents.slice(0);
                  changed[index] = newchild;
                  return new Interior(undefined, changed);
              }
          };

          Interior.prototype.remove = function (shift, hashCode, key) {
              var index = mask(shift, hashCode);

              if (this.contents[index] === undefined) {
                  return this;
              } else {
                  var newval = this.contents[index].remove(shift + hamt.BITS, hashCode, key), changed = this.contents.slice(0), population = 0, instance = undefined;

                  if (newval === null) {
                      newval = undefined;
                  }
                  changed[index] = newval;

                  for (var i = 0; i < changed.length; i++) {
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
                      return new Interior(undefined, changed);
                  }
              }
          };

          Interior.prototype.forEach = function (fn, context, source) {
              if (typeof context === "undefined") { context = undefined; }
              if (typeof source === "undefined") { source = undefined; }
              var len = this.contents.length;
              for (var i = 0; i < len; i++) {
                  if (this.contents[i] !== undefined) {
                      this.contents[i].forEach(fn, context, source);
                  }
              }
          };
          return Interior;
      })();
      hamt.Interior = Interior;

      var Leaf = (function () {
          function Leaf(ignore, hashCode, key, value) {
              if (ignore !== undefined) {
                  throw "TypeError: constructor is private - use the .from methods to create new StringMaps";
              }
              this.hashCode = hashCode;
              this.key = key;
              this.value = value;
              //            freeze(this);
          }
          Leaf.prototype.get = function (shift, hashCode, key, default_) {
              if (exports.equals(key, this.key)) {
                  return this.value;
              }
              return default_;
          };

          Leaf.prototype.set = function (shift, hashCode, key, value) {
              if (exports.equals(this.key, key)) {
                  // replace value.
                  if (exports.equals(value, this.value)) {
                      return this;
                  } else {
                      // replace ourself
                      return new Leaf(undefined, hashCode, key, value);
                  }
              } else if (hashCode === this.hashCode) {
                  // collision
                  return new Collision(undefined, this.hashCode, []).set(shift, this.hashCode, this.key, this.value).set(shift, hashCode, key, value);
              } else {
                  // create a new try, and place our
                  var newroot = new Interior(undefined, []);
                  return newroot.set(shift, this.hashCode, this.key, this.value).set(shift, hashCode, key, value);
              }
          };

          Leaf.prototype.remove = function (shift, hashCode, key) {
              // just remove ourselves.
              return null;
          };

          Leaf.prototype.forEach = function (fn, context, source) {
              if (typeof context === "undefined") { context = undefined; }
              if (typeof source === "undefined") { source = undefined; }
              fn.call(context, this.value, this.key, source);
          };
          return Leaf;
      })();
      hamt.Leaf = Leaf;

      var Collision = (function () {
          function Collision(ignore, hashCode, values) {
              this.hashCode = hashCode;
              this.values = values;
              //            freeze(this);
          }
          Collision.prototype.get = function (shift, hashCode, key, default_) {
              for (var i = 0; i < this.values.length / 2; i++) {
                  if (exports.equals(this.values[2 * i], key)) {
                      return this.values[2 * i + 1];
                  }
              }
              return default_;
          };

          Collision.prototype.set = function (shift, hashCode, key, value) {
              for (var i = 0; i < this.values.length / 2; i++) {
                  if (exports.equals(this.values[2 * i], key)) {
                      if (exports.equals(this.values[2 * i + 1], value)) {
                          return this;
                      }
                      var newvalues = this.values.slice(0);
                      newvalues[i + 1] = value;
                      return new Collision(undefined, hashCode, newvalues);
                  }
              }
              newvalues = this.values.slice(0);
              newvalues.push(key);
              newvalues.push(value);
              return new Collision(undefined, hashCode, newvalues);
          };

          Collision.prototype.remove = function (shift, hashCode, key) {
              var newvalues = [];
              for (var i = 0; i < this.values.length / 2; i++) {
                  if (!exports.equals(this.values[2 * i], key)) {
                      newvalues.push(this.values[2 * i]);
                      newvalues.push(this.values[2 * i + 1]);
                  }
              }

              // TODO I'm pretty sure that an empty state is impossible.
              if (newvalues.length == 0) {
                  return null;
              } else if (newvalues.length == 2) {
                  return new Leaf(undefined, hashCode, newvalues[0], newvalues[1]);
              } else {
                  return new Collision(undefined, hashCode, newvalues);
              }
          };

          Collision.prototype.forEach = function (fn, context, source) {
              if (typeof context === "undefined") { context = undefined; }
              if (typeof source === "undefined") { source = undefined; }
              var len = this.values.length / 2;
              for (var i = 0; i < len; i++) {
                  fn.call(context, this.values[2 * i], this.values[2 * i + 1], source);
              }
          };
          return Collision;
      })();
      hamt.Collision = Collision;
  })(exports.hamt || (exports.hamt = {}));
  var hamt = exports.hamt;

  // Taken from http://www.cse.yorku.ca/~oz/hash.html
  function _stringHash(source) {
      if (source === null || source === undefined) {
          return 0;
      } else if (typeof source !== 'string') {
          throw "TypeError: only strings are supported for hashing.";
      }

      var hash = 0, current;

      for (var i = 0; i < source.length; i++) {
          current = source.charCodeAt(i);
          hash = current + (hash << 6) + (hash << 16) - hash;
      }

      return hash;
  }

  function hashCode(key) {
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
          throw "TypeError: object must support .hashCode to be a member of a hash function.";
      }

      var res = key['hashCode']();
      if (typeof res !== 'number') {
          throw "TypeError: hashCode must return a number.";
      }
      return res;
  }
  exports.hashCode = hashCode;

  var HashMap = (function () {
      function HashMap(ignored, hashFn, root) {
          if (ignored !== undefined) {
              throw "TypeError: constructor is private: please use .from to create a new HashMap";
          }
          this.hashFn = hashFn;
          this.root = root;
          freeze(this);
      }
      HashMap.prototype.get = function (key, default_) {
          if (this.root === null) {
              return default_;
          }
          return this.root.get(0, this.hashFn(key), key, default_);
      };

      HashMap.prototype.has = function (key) {
          if (this.root === null) {
              return false;
          }
          var NOTFOUND = {};
          return (this.root.get(0, this.hashFn(key), key, NOTFOUND) !== NOTFOUND);
      };

      HashMap.prototype.set = function (key, value) {
          var newroot;
          if (this.root === null) {
              newroot = new hamt.Leaf(undefined, this.hashFn(key), key, value);
          } else {
              newroot = this.root.set(0, this.hashFn(key), key, value);
          }

          if (newroot === this.root) {
              return this;
          }

          return new HashMap(undefined, this.hashFn, newroot);
      };

      HashMap.prototype.remove = function (key) {
          if (this.root === null) {
              return this;
          }

          var newroot = this.root.remove(0, this.hashFn(key), key);
          if (newroot === this.root) {
              return this;
          }

          return new HashMap(undefined, this.hashFn, newroot);
      };

      HashMap.prototype.forEach = function (fn, context) {
          if (typeof context === "undefined") { context = undefined; }
          if (this.root === null) {
              return;
          }

          this.root.forEach(fn, context, this);
      };

      HashMap.from = function (hashFn) {
          if (typeof hashFn !== 'function') {
              throw "TypeError: Must provide a hash function to .from";
          }
          return new HashMap(undefined, hashFn, null);
      };

      HashMap.prototype.equals = function (other) {
          var _this = this;
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
          var diff = false;
          this.forEach(function (item, key) {
              if (!exports.equals(item, other.get(key))) {
                  diff = true;
              }
          });
          other.forEach(function (item, key) {
              if (!exports.equals(item, _this.get(key))) {
                  diff = true;
              }
          });

          return !diff;
      };
      return HashMap;
  })();
  exports.HashMap = HashMap;

  var StringMap = (function () {
      function StringMap(ignored, actual) {
          if (ignored !== undefined) {
              throw "TypeError: constructor is private - use the .from methods to create new StringMaps";
          }
          this.actual = actual;
          freeze(this);
      }
      StringMap.prototype.get = function (key, default_) {
          return this.actual.get(key, default_);
      };

      StringMap.prototype.has = function (key) {
          if (this.actual === null) {
              return false;
          }
          var NOTFOUND = {};
          return (this.actual.get(key, NOTFOUND) !== NOTFOUND);
      };

      StringMap.prototype.set = function (key, value) {
          var newactual = this.actual.set(key, value);
          if (newactual === this.actual) {
              return this;
          }

          return new StringMap(undefined, newactual);
      };

      StringMap.prototype.remove = function (key) {
          var newactual = this.actual.remove(key);
          if (newactual === this.actual) {
              return this;
          }

          return new StringMap(undefined, newactual);
      };

      StringMap.from = function (sample) {
          if (sample === null || sample === undefined) {
              return new StringMap(undefined, new HashMap(undefined, _stringHash, null));
          } else if (sample instanceof StringMap) {
              return sample;
          } else {
              // make a new item, and apply all children.
              var hamt = new HashMap(undefined, _stringHash, null);
              for (var key in sample) {
                  if (Object.hasOwnProperty.call(sample, key)) {
                      hamt = hamt.set(key, sample[key]);
                  }
              }
              return new StringMap(undefined, hamt);
          }
      };

      StringMap.prototype.forEach = function (fn, context) {
          if (typeof context === "undefined") { context = undefined; }
          if (this.actual === null) {
              return;
          }

          this.actual.forEach(fn, context);
      };

      StringMap.prototype.equals = function (other) {
          if (this === other) {
              return true;
          }

          if (!(other instanceof StringMap)) {
              return false;
          }

          return exports.equals(this.actual, other.actual);
      };
      return StringMap;
  })();
  exports.StringMap = StringMap;

  /**
  * The q module allows you to modify complex persistent structures in a simple way.
  * way.  Key to this is (a) the ability to descend the object tree, and (b) to know how to effect
  * a change.
  */
  (function (query) {
      /**
      * For a given set of path segments (strings or Swappers)
      * @param parts
      */
      function path() {
          var parts = [];
          for (var _i = 0; _i < (arguments.length - 0); _i++) {
              parts[_i] = arguments[_i + 0];
          }
          var actual = [];

          parts.forEach(function (part) {
              if (typeof part === 'string') {
                  actual.push(prop(part));
              } else if (typeof part.current === 'function' && typeof part.replace === 'function') {
                  actual.push(part);
              } else {
                  throw "Each part must be a path segment: " + part;
              }
          });

          return new SimplePath(ArrayVector.from(actual));
      }
      query.path = path;

      var SimplePath = (function () {
          function SimplePath(inner) {
              this.inner = inner;
              //            freeze(this);
          }
          SimplePath.prototype.swap = function (root, change) {
              var _this = this;
              var recurSwap = function (idx, current) {
                  if (idx === _this.inner.length) {
                      return change(current);
                  } else {
                      var changed = recurSwap(idx + 1, _this.inner.get(idx).current(current));
                      return _this.inner.get(idx).replace(current, changed);
                  }
              };
              return recurSwap(0, root);
          };

          SimplePath.prototype.value = function (root) {
              var last = root;
              this.inner.forEach(function (segment) {
                  last = segment.current(last);
              });
              return last;
          };

          SimplePath.prototype.replace = function (root, value) {
              return this.swap(root, function () {
                  return value;
              });
          };
          return SimplePath;
      })();

      function swap(root, pathParts, change) {
          return path.apply(null, pathParts).swap(root, change);
      }
      query.swap = swap;

      function replace(root, pathParts, value) {
          return path.apply(null, pathParts).replace(root, value);
      }
      query.replace = replace;

      /**
      * PathSegment function for a Map or Vector object.  Will inspect the current root and
      * descend based on the provided key.
      */
      function at(key) {
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
      query.at = at;

      /**
      * Generate a prop
      * @param propName
      * @returns {PathSegment}
      */
      function prop(propName) {
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
      query.prop = prop;
  })(exports.query || (exports.query = {}));
  var query = exports.query;

  return exports;
}));