import equal from "fast-deep-equal";
import { makeModule, makeFunction } from "../../src/runtime.js";

/**
 * The file should export at least name, module, requires, and nativeRequires
 */

/**
 * Defines a few global functions and utilities for use within the language
 */

const MODULE = "base";
export const requires = ["error"];
export const nativeRequires = [];
export const name = MODULE;

/**
 * Get the type of a Daniel value
 * @param {Any} obj
 * @returns {String}
 */
const getType = (obj) => {
  if (obj === null || obj === undefined) {
    return "nil";
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
  const length = (obj) => {
    if (obj.length !== undefined) {
      return obj.length;
    }

    if (obj.size !== undefined) {
      return obj.size;
    }

    return -1;
  };

  const ref = (obj, i) => {
    let val;

    if (obj instanceof Map) {
      val = obj.get(i);
    } else {
      val = obj[i];
    }

    if (val === undefined) {
      return err["exn:out-of-range"](i);
    }

    return val;
  };

  return makeModule(name, {
    type: makeFunction(getType, MODULE),
    length: makeFunction(length, MODULE),
    "equal?": makeFunction((a, b) => equal(a, b), MODULE, { name: "equal?" }),
    "eq?": makeFunction((a, b) => Object.is(a, b), MODULE, { name: "eq?" }),
    ref: makeFunction(ref, MODULE),
  });
};
