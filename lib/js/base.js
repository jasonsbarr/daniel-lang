import { makeModule, makeFunction } from "../../src/runtime.js";

/**
 * The file should export at least module, requires, and nativeRequires
 */

/**
 * Defines a few global functions and utilities for use within the language
 */

const MODULE = "base";
const URL = "builtins://base";
const requires = [];
const nativeRequires = [];

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
  return makeModule(
    MODULE,
    URL,
    {
      type: makeFunction(getType, MODULE, { name: "type" }),
    },
    requires,
    nativeRequires
  );
};
