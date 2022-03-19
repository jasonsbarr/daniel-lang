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
  func = (...args) => {
    const f = curryN(arity, func);
    const val = f(...args);

    if (typeof val === "function" && !val.daniel) {
      return makeFunction(val, module, { varargs });
    }
    return val;
  };
  func.__name__ = name;
  func.arity = arity;
  func.module = module;
  func.varargs = varargs;
  func.daniel = true;

  Object.defineProperty(func, "toString", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: () => `Function(${func.module}.${func.name})`,
  });

  return func;
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
   * @param {String} url
   * @param {Object} provides
   * @param {String[]} requires
   * @param {String[]} nativeRequires
   */
  constructor(name, url, provides, requires, nativeRequires) {
    this.name = Symbol(name);
    this.url = url;
    this.provides = provides;
    this.requires = requires;
    this.nativeRequires = nativeRequires;
  }

  toString() {
    return `<${this.name}>`;
  }
}

/**
 * Make a Daniel module from a collection of provided JavaScript objects
 * @param {String} name The module name
 * @param {String} url The module URL
 * @param {Object} provides The bindings it provides
 * @param {String[]} requires Daniel language module dependencies
 * @param {String[]} nativeRequires native (JS) module dependencies
 * @returns {Module}
 */
export const makeModule = (name, url, provides, requires, nativeRequires) => {
  let vals = Object.create(null);
  let keys = getAllOwnKeys(provides);

  for (let key of keys) {
    vals[key] = provides[key];
  }

  return new Module(name, url, vals, requires, nativeRequires);
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
