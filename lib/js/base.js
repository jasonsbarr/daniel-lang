import { makeModule, makeFunction } from "../../src/runtime.js";

/**
 * The file should export at least name, module, requires, and nativeRequires
 */

/**
 * Defines a few global functions and utilities for use within the language
 */

const MODULE = "base";
export const requires = [];
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
export const module = (runtime) => {
  return makeModule(name, {
    type: makeFunction(getType, MODULE, { name: "type" }),
  });
};
