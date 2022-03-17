import { curry } from "@jasonsbarr/functional-core";

/**
 * Convert a JS function into a Daniel function object
 *
 * Daniel functions are autocurried
 * @param {Function} func
 * @param {String} name
 * @param {Number} arity
 */
export const makeFunction = (func, name, arity, module = "<main>") => {
  name = name ?? (func.name || "<lambda>");
  arity = arity ?? func.length;
  func = curry(func);
  func.name = name;
  func.arity = arity;
  func.module = module;

  Object.defineProperty(func, "toString", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: () => `Function(${func.module}-${func.name})`,
  });

  return func;
};

class Module {
  /**
   * @param {String} name
   * @param {Object} provides
   * @param {String} url
   * @param {String[]} deps
   */
  constructor(
    name,
    provides,
    url,
    { requires = [], nativeRequires = [] } = {}
  ) {
    this.name = name;
    this.provides = provides;
    this.url = url;
    this.deps = deps;
    this.requires = requires;
    this.nativeRequires = nativeRequires;
  }

  toString() {
    return `Module(${this.name})`;
  }
}

/**
 * Make a Daniel module from a collection of provided JavaScript objects
 * @param {String} name
 * @param {Object} provides
 * @param {String} url
 * @returns {Module}
 */
export const makeModule = (
  name,
  provides,
  url,
  deps,
  { requires = [], nativeRequires = [] } = {}
) => {
  let vals = Object.create(null);

  for (let [k, v] of provides) {
    if (typeof v === "function") {
      v = makeFunction(v, v.name, v.length, name);
    }

    vals[k] = v;
  }

  return new Module(name, vals, url, deps, { requires, nativeRequires });
};
