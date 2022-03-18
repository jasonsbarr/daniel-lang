const path = require("path");
const { curryN } = require("ramda");
const { getFileURL } = require("./utils");

/**
 * Convert a JS function into a Daniel function object
 *
 * Daniel functions are autocurried
 * @param {Function} func
 * @param {String} name
 * @param {Number} arity
 * @param {Boolean} varargs
 * @param {String} module
 */
const makeFunction = (
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
  func.name = name;
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
const resolveRequire = (rq) => {};

/**
 * Resolves a native (JS) module to an absolute path from a require string
 *
 * Currently only works for builtin modules (but this will change)
 * @param {String} rq
 * @returns {String}
 */
const resolveNativeRequire = (rq) => {
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
const makeModule = (name, url, provides, requires, nativeRequires) => {
  let vals = Object.create(null);

  for (let [k, v] of Object.entries(provides)) {
    vals[Symbol.for(k)] = v;
  }

  return new Module(name, url, vals, requires, nativeRequires);
};

/**
 * If not a browser, we'll assume the JS runtime is Node
 */
const isBrowser = () => typeof window !== "undefined";

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
const createRuntime = ({
  stdin = process.stdin,
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) => {
  return {
    stdin,
    stdout,
    stderr,
    isBrowser,
    isDanielFunction,
  };
};

module.exports = {
  makeFunction,
  resolveRequire,
  resolveNativeRequire,
  makeModule,
  createRuntime,
};
