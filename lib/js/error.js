import { makeModule, makeFunction } from "../../src/runtime.js";

const MODULE = "builtin:error";
const requires = [];
const nativeRequires = [];
const URL = import.meta.url;

export const module = (runtime) => {
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
    URL,
    requires,
    nativeRequires
  );
};
