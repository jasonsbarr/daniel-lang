const path = require("path");
// const { curryN } from "@jasonsbarr/functional-core";

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
  func = curryN(arity, func);
  func.name = name;
  func.arity = arity;
  func.module = module;
  func.varargs = varargs;

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
  if (rq.startsWith("builtin:")) {
    const mod = rq.split(":")[1];
    return path.join(__dirname, "../lib/js", `${mod}.js`);
  }

  throw new Error(`Could not resolve native module ${rq}`);
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
   */
  constructor(name, provides) {
    this.name = name;
    this.url = url;
    this.provides = provides;
  }

  toString() {
    return `<${this.name}>`;
  }
}

/**
 * Make a Daniel module from a collection of provided JavaScript objects
 * @param {String} name The module name
 * @param {Object} provides The bindings it provides
 * @returns {Module}
 */
const makeModule = (name, url, provides) => {
  let vals = {};

  for (let [k, v] of Object.entries(provides)) {
    vals[Symbol.for(k)] = v;
  }

  return new Module(name, url, vals);
};

module.exports = {
  makeFunction,
  resolveRequire,
  resolveNativeRequire,
  makeModule,
};
