const { makeModule, makeFunction } = require("../../src/runtime.js");

const MODULE = "builtin:error";
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

  return makeModule(
    MODULE,
    {
      fail: makeFunction(fail, { module: MODULE }),
    },
    requires,
    nativeRequires
  );
};

module.exports = {
  module: theModule,
  requires,
  nativeRequires,
};
