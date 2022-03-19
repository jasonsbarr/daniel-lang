import { makeModule, makeFunction } from "../../src/runtime.js";

const MODULE = "error";
export const requires = [];
export const nativeRequires = [];
export const name = MODULE;

export class RuntimeError extends Error {
  constructor(msg) {
    super(msg);
  }

  toString() {
    return String(this.stack ? this.stack : this.message);
  }
}

export class RefError extends RuntimeError {
  /**
   * Error for when name is accessed without being initialized in the current scope
   * @param {String} name
   */
  constructor(name) {
    super(`ReferenceError: ${name} is not defined`);
    this.name = "ReferenceError";
  }
}

export const module = (runtime) => {
  const fail = (msg) => {
    throw new RuntimeError(msg);
  };

  return makeModule(name, {
    fail: makeFunction(fail, MODULE),
    "reference-error": makeFunction(
      (name) => {
        throw new RefError(name);
      },
      MODULE,
      { name: "reference-error" }
    ),
  });
};
