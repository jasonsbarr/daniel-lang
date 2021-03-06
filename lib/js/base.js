import equal from "fast-deep-equal";
import hash from "object-hash";
import { v4 } from "uuid";
import { makeModule, makeFunction } from "../../src/runtime.js";
import { Range } from "../../src/interpreter/types.js";
import { RuntimeError, OutOfRangeError } from "./error.js";
import { makeObject } from "./_object.js";

/**
 * The file should export at least name, module, requires, and nativeRequires
 */

/**
 * Defines a few global functions and utilities for use within the language
 */

const MODULE = "base";
export const requires = [];
export const nativeRequires = ["error"];
export const name = MODULE;

/**
 * Get the type of a Daniel value
 * @param {Any} obj
 * @returns {String}
 */
export const getType = (obj) => {
  if (obj === null || obj === undefined) {
    return "nil";
  }

  if (obj.type) {
    return obj.type;
  }

  const t = typeof obj;

  if (t === "object") {
    if (Array.isArray(obj)) {
      return "list";
    }

    if (obj instanceof Map) {
      return "hash";
    }
  }

  // primitive or function
  return t;
};

/**
 * The module function must be exported as module and requires parameters
 * of the runtime followed by any requires and native requires
 * as objects in that exact order.
 * @returns {Module}
 */
export const module = (runtime, err) => {
  const cons = (fst, snd) => {
    if (fst === undefined || snd === undefined) {
      return err.throw(
        err["exn:arguments"]("cons", 2, fst === undefined ? 0 : 1)
      );
    }
    if (!Array.isArray(snd)) {
      return [fst, snd];
    }
    return [fst, ...snd];
  };

  const fst = (list) => {
    if (!Array.isArray(list)) {
      return err.throw(err["exn:type"]("list", getType(list)));
    }

    if (list.length < 1) {
      return err.throw(
        err["exn:value"]("Argument to fst must have at least 1 element")
      );
    }

    return list[0];
  };

  const snd = (list) => {
    if (!Array.isArray(list)) {
      return err.throw(err["exn:type"]("list", getType(list)));
    }

    if (list.length < 2) {
      return err.throw(
        err["exn:value"]("Argument to snd must have at least 2 elements")
      );
    }

    return list[1];
  };

  const last = (list) => {
    if (!Array.isArray(list)) {
      return err.throw(err["exn:type"]("list", getType(list)));
    }

    if (list.length < 1) {
      return err.throw(
        err["exn:value"]("Argument to last must have at least 1 element")
      );
    }

    return list[list.length - 1];
  };

  const concat = (...lists) => {
    if (lists.length === 0) {
      return [];
    }

    let l = [];

    for (let list of lists) {
      if (!Array.isArray(list)) {
        return err.throw(
          err["exn:arguments"]("concat", "1 or more lists", getType(list))
        );
      }

      l = l.concat(list);
    }

    return l;
  };

  const tail = (list) => {
    if (!Array.isArray(list)) {
      return err.throw(err["exn:arguments"]("tail", "list", getType(list)));
    }

    return list.slice(1);
  };

  const length = (obj) => {
    if (obj.length !== undefined) {
      return obj.length;
    }

    if (obj.size !== undefined) {
      return obj.size;
    }

    return err.throw(
      err["exn:arguments"](
        "length",
        "a type with a length property",
        getType(obj)
      )
    );
  };

  const slice = (start, end, list) => list.slice(start, end);

  const get = (i, obj) => {
    let val;

    if (typeof i === "object" && i !== null) {
      i = hash(i);
    }

    if (typeof obj.get === "function") {
      val = obj.get(i);
    } else {
      val = obj[i];
    }

    if (val === undefined) {
      err.throw(err["exn:out-of-range"](i));
    }

    return val;
  };

  const has = (n, obj) => {
    if (obj[n] !== undefined) {
      return true;
    } else if (obj.get(n) !== undefined) {
      return true;
    }

    return false;
  };

  const set = (i, val, obj) => {
    // also need ability to retrieve keys after hashing
    if (typeof i === "object" && i !== null) {
      obj._keys = obj._keys ? [...obj._keys, i] : [i];
      i = hash(i);
    }

    if (typeof obj.set === "function") {
      obj.set(i, val);
    } else {
      obj[i] = val;
    }
  };

  const keys = (obj) => {
    let ks;
    if (obj._keys) {
      ks = obj._keys;
    } else if (typeof obj.keys === "function") {
      ks = obj.keys();
    } else {
      ks = Object.keys(obj);
    }

    if (ks === undefined || ks === null) {
      err.throw(err["exn:runtime"]("Argument does not have keys"));
    }

    return ks;
  };

  const values = (obj) => {
    let vals;
    if (typeof obj.values === "function") {
      vals = obj.values();
    } else {
      vals = Object.values(obj);
    }

    if (vals === undefined || vals === null) {
      err.throw(err["exn:runtime"]("Argument does not have values"));
    }

    return vals;
  };

  const entries = (obj) => {
    let es;
    if (typeof obj.entries === "function") {
      es = obj.entries();
    } else {
      es = Object.entries(obj);
    }

    if (es === undefined || es === null) {
      err.throw(err["exn:runtime"]("Argument does not have key/value pairs"));
    }

    return es;
  };

  const range = (...args) => {
    let start;
    let end;
    let step;

    if (args.length === 1) {
      start = 0;
      end = args[0];
      step = 1;
    } else if (args.length === 2) {
      start = args[0];
      end = args[1];
      step = 1;
    } else if (args.length === 3) {
      start = args[0];
      end = args[1];
      step = args[2];
    } else {
      return err.throw(
        err["exn:arguments"]("range", "between 1 and 3", args.length)
      );
    }

    return new Range(start, end, step);
  };

  const struct = (map) => {
    if (!map instanceof Map) {
      return err.throw(err["exn:arguments"]("struct", "hash", getType(map)));
    }

    return Object.freeze(makeObject("struct", struct, map));
  };

  const gensym = (prefix = Symbol()) =>
    Symbol.for(`${prefix.description ?? ""}${hash(v4()).slice(0, 6)}`);

  return makeModule(name, {
    type: makeFunction(getType, MODULE),
    cons: makeFunction(cons, MODULE),
    fst: makeFunction(fst, MODULE),
    head: makeFunction(fst, MODULE, { name: "head" }),
    snd: makeFunction(snd, MODULE),
    last: makeFunction(last, MODULE),
    concat: makeFunction(concat, MODULE),
    tail: makeFunction(tail, MODULE),
    list: makeFunction((...args) => args, MODULE, { varargs: true }),
    length: makeFunction(length, MODULE),
    slice: makeFunction(slice, MODULE),
    "equal?": makeFunction((a, b) => equal(a, b), MODULE, { name: "equal?" }),
    "eq?": makeFunction((a, b) => Object.is(a, b), MODULE, { name: "eq?" }),
    get: makeFunction(get, MODULE),
    has: makeFunction(has, MODULE),
    set: makeFunction(set, MODULE),
    keys: makeFunction(keys, MODULE),
    values: makeFunction(values, MODULE),
    entries: makeFunction(entries, MODULE),
    range: makeFunction(range, MODULE, { arity: 1, variadic: true }),
    hash: makeFunction(hash, MODULE),
    struct: makeFunction(struct, MODULE),
    gensym: makeFunction(gensym, MODULE),
  });
};
