import { makeModule, makeFunction } from "../../src/runtime.js";

const MODULE = "error";
const URL = "builtins://error";
export const requires = [];
export const nativeRequires = [];
export const name = MODULE;

export class RuntimeError extends Error {
  constructor(msg) {
    super(msg);
  }
}

export class RefError extends RuntimeError {
  /**
   * Error for when name is accessed without being initialized in the current scope
   * @param {Symbol} name
   */
  constructor(name) {
    super(`ReferenceError: ${name.description} is not defined`);
    this.name = "ReferenceError";
  }
}

export const module = (runtime) => {
  const fail = (msg) => {
    throw new RuntimeError(msg);
  };

  return makeModule(
    MODULE,
    URL,
    {
      fail: makeFunction(fail, MODULE),
      "reference-error": makeFunction((name) => {
        throw new RefError(name);
      }, MODULE),
    },
    requires,
    nativeRequires
  );
};
