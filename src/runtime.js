import path from "path";
import { curryN } from "ramda";
import { getFileURL, isBrowser, dirname, getAllOwnKeys } from "./utils.js";

const __dirname = dirname(import.meta.url);
let STDOUT, STDIN, STDERR;

if (!isBrowser()) {
  STDOUT = process.stdout;
  STDIN = process.stdin;
  STDERR = process.stderr;
} else {
  STDOUT = { write: console.log };
  STDIN = {};
  STDERR = { write: console.error };
}

/**
 * Convert a JS function into a Daniel function object
 *
 * Daniel functions are autocurried
 * @param {Function} func
 * @param {String} name
 * @param {Number} arity
 * @param {Boolean} varargs
 * @param {String} module
 * @returns {Function}
 */
export const makeFunction = (
  func,
  module = "<main>",
  { name, arity, varargs = false } = {}
) => {
  name = name ?? (func.name || "<lambda>");
  arity = arity ?? func.length;
  let f = (...args) => {
    func = curryN(arity, func);
    const val = func(...args);

    if (typeof val === "function" && !val.daniel) {
      return makeFunction(val, module, { varargs });
    }
    return val;
  };
  f.__name__ = name;
  f.arity = arity;
  f.module = module;
  f.varargs = varargs;
  f.daniel = true;

  Object.defineProperty(f, "toString", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: () => `Function(${f.module}.${f.__name__})`,
  });

  return f;
};

/**
 * Resolves a Daniel-lang module to an absolute path from a require string
 * @param {String} rq
 * @returns {String}
 */
export const resolveRequire = (rq) => {};

/**
 * Resolves a native (JS) module to an absolute path from a require string
 *
 * Currently only works for builtin modules (but this will change)
 * @param {String} rq
 * @returns {String}
 */
export const resolveNativeRequire = (rq) => {
  return getFileURL(path.join(__dirname, "../lib/js", `${rq}.js`));
};

/**
 * A Daniel module created from a native (JS) object
 *
 * The file containing a native module should provide a named export called
 * module that is a function that returns an object of this class
 */
class Module {
  /**
   * @param {String} name
   * @param {Object} provides
   */
  constructor(name, provides) {
    this.__name__ = name;

    for (let key of getAllOwnKeys(provides)) {
      this[key] = provides[key];
    }
  }

  toString() {
    return `<${this.__name__}>`;
  }
}

/**
 * Make a Daniel module from a collection of provided JavaScript objects
 * @param {String} name The module name
 * @param {Object} provides The bindings it provides
 * @returns {Module}
 */
export const makeModule = (name, provides) => {
  let vals = Object.create(null);
  let keys = getAllOwnKeys(provides);

  for (let key of keys) {
    vals[key] = provides[key];
  }

  return new Module(name, vals);
};

/**
 * Checks if a function is a native (JS) or Daniel function
 * @param {Function} func
 * @returns {Boolean}
 */
const isDanielFunction = (func) => typeof func === "function" && func.daniel;

/**
 * Returns a Daniel runtime object based on the current platform
 * @param {Object} stdin
 * @param {Object} stdout
 * @param {Object} stderr
 * @returns {Object}
 */
export const createRuntime = ({
  stdin = STDIN,
  stdout = STDOUT,
  stderr = STDERR,
} = {}) => {
  return {
    stdin,
    stdout,
    stderr,
    isBrowser,
    isDanielFunction,
  };
};

export { STDOUT, STDIN, STDERR };
