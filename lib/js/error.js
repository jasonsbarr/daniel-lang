const { makeModule, makeFunction } = require("../../src/runtime.js");

const MODULE = "error";
const URL = "builtins://error";
const requires = [];
const nativeRequires = [];

const theModule = (runtime) => {
  class RuntimeError extends Error {
    constructor(msg) {
      super(msg);
    }
  }

  const fail = (msg) => {
    throw new RuntimeError(msg);
  };

  return makeModule(MODULE, URL, {
    fail: makeFunction(fail, MODULE),
  });
};

module.exports = {
  module: theModule,
  requires,
  nativeRequires,
};
