import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { curryN } from "ramda";
import { getFileURL, isBrowser, dirname, getAllOwnKeys } from "./utils.js";
import { makeObject } from "../lib/js/_object.js";
import { printStr } from "../lib/js/io.js";

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

  Object.defineProperty(f, "_str", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: () => `Function(${f.module}.${f.__name__})`,
  });

  return f;
};

/**
 * Resolve an in-language import to a file URL
 * @param {String} importVal The import string value
 * @param {*} callingFile The file importing the module
 */
export const resolveImport = (importVal, callingFile) => {
  const basePath = callingFile.split("/").slice(0, -1).join("/");

  if (importVal.startsWith(".")) {
    const absPath = path.join(fileURLToPath(basePath), importVal);
    // relative import
    if (fs.existsSync(`${absPath}.dan`)) {
      // Daniel module
      return getFileURL(`${absPath}.dan`);
    } else if (fs.existsSync(`${absPath}.js`)) {
      // Native (JS) module
      return getFileURL(`${absPath}.js`);
    }
  } else {
    // global module
    if (fs.existsSync(path.join(__dirname, "../lib", `${importVal}.dan`))) {
      return resolveRequire(importVal);
    } else if (
      fs.existsSync(path.join(__dirname, "../lib/js", `${importVal}.js`))
    ) {
      return resolveNativeRequire(importVal);
    }
  }

  throw new Error(`Could not resolve file for module ${importVal}`);
};

/**
 * Resolves a Daniel-lang module to an absolute path from a require string
 * @param {String} rq
 * @returns {String}
 */
export const resolveRequire = (rq) => {
  if (rq.startsWith("file://")) {
    // already resolved
    return rq;
  }

  // global module
  return getFileURL(path.join(__dirname, "../lib", `${rq}.dan`));
};

/**
 * Resolves a native (JS) module to an absolute path from a require string
 *
 * Currently only works for builtin modules (but this will change)
 * @param {String} rq
 * @returns {String}
 */
export const resolveNativeRequire = (rq) => {
  if (rq.startsWith("file://")) {
    // already resolved
    return rq;
  }

  // global module
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

export const makeClass = (
  { name, superClass, classVars, publicMethods, privateMethods, staticMethods },
  module
) => {
  let proto = Object.create(superClass.proto);
  let newMethod = () => Object.create(proto);
  let initMethod = (obj) => obj;

  for (let [n, method] of publicMethods) {
    proto[n] = method;

    if (n === "new") {
      newMethod = method;
    }

    if (n === "init") {
      initMethod = method;
    }
  }

  const constructor = (...args) => {
    let obj = newMethod(proto, ...args);

    obj.toString = () => {
      return `{${this.type}: ${[...Object.entries(this)]
        .map(
          ([k, v]) =>
            `${typeof k === "symbol" ? k.description : k} => ${printStr(v)}`
        )
        .join(" ")}}`;
    };

    obj.constructor = constructor;

    Object.defineProperty(obj, "toString", {
      writable: false,
      configurable: false,
      enumerable: false,
    });

    Object.defineProperty(obj, "constructor", {
      writable: false,
      enumerable: false,
      configurable: false,
    });

    return obj;
  };

  constructor.proto = proto;
  constructor.__name__ = name;
  constructor.type = "Class";

  for (let [n, value] of classVars) {
    constructor[n] = value;
  }

  for (let [n, method] of staticMethods) {
    constructor[n] = method;

    Object.defineProperty(constructor, n, {
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }

  Object.defineProperty(constructor, "type", {
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(constructor, "toString", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: () => `Class(${module}.${name})`,
  });

  return constructor;
};

export const makeMethod = (
  method,
  className,
  module,
  { name, arity, varargs = false } = {}
) => {
  method.__name__ = name ?? method.name ?? "<method>";
  arity = arity ?? method.length;
  method.className = className;
  method.varargs = varargs;

  Object.defineProperty(method, "_str", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: () => `Function(${module}.${className}.${method.__name__})`,
  });

  return method;
};

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
    makeFunction,
    makeModule,
    resolveRequire,
    resolveNativeRequire,
    makeClass,
    makeMethod,
  };
};

export { STDOUT, STDIN, STDERR };
