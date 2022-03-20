import equal from "fast-deep-equal";
import { makeModule, makeFunction } from "../../src/runtime.js";
import { Range } from "../../src/interpreter/types.js";
import { OutOfRangeError } from "./error.js";

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

const get = (obj, i) => {
  let val;

  if (typeof obj.get === "function") {
    val = obj.get(i);
  } else {
    val = obj[i];
  }

  if (val === undefined) {
    throw new OutOfRangeError(i);
  }

  return val;
};

/**
 * The module function must be exported as module and requires parameters
 * of the runtime followed by any requires and native requires
 * as objects in that exact order.
 * @returns {Module}
 */
export const module = (runtime, err) => {
  const length = (obj) => {
    if (obj.length !== undefined) {
      return obj.length;
    }

    if (obj.size !== undefined) {
      return obj.size;
    }

    return -1;
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
      return err["exn:arguments"]("range", "between 1 and 3", args.length);
    }

    return new Range(start, end, step);
  };

  return makeModule(name, {
    type: makeFunction(getType, MODULE),
    length: makeFunction(length, MODULE),
    "equal?": makeFunction((a, b) => equal(a, b), MODULE, { name: "equal?" }),
    "eq?": makeFunction((a, b) => Object.is(a, b), MODULE, { name: "eq?" }),
    get: makeFunction(get, MODULE),
    range: makeFunction(range, MODULE, { arity: 1, variadic: true }),
  });
};
