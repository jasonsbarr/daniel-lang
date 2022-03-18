const { makeModule, makeFunction } = require("../../src/runtime.js");

const MODULE = "error";
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

  return makeModule(MODULE, {
    fail: makeFunction(fail, MODULE),
  });
};

module.exports = {
  module: theModule,
  requires,
  nativeRequires,
};
