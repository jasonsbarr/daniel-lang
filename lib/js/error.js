const { makeModule, makeFunction } = require("../../src/runtime.js");

const MODULE = "error";
const URL = "builtins://error";
const requires = [];
const nativeRequires = [];

class RuntimeError extends Error {
  constructor(msg) {
    super(msg);
  }
}

class RefError extends RuntimeError {
  /**
   * Error for when name is accessed without being initialized in the current scope
   * @param {Symbol} name
   */
  constructor(name) {
    super(`ReferenceError: ${name.description} is not defined`);
  }
}

const theModule = (runtime) => {
  const fail = (msg) => {
    throw new RuntimeError(msg);
  };

  return makeModule(MODULE, URL, {
    fail: makeFunction(fail, MODULE),
    "reference-error": makeFunction((name) => {
      throw new RefError(name);
    }, MODULE),
  });
};

module.exports = {
  RuntimeError,
  RefError,
  module: theModule,
  requires,
  nativeRequires,
};
