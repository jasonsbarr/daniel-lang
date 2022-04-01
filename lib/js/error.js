import { makeModule, makeFunction } from "../../src/runtime.js";

const MODULE = "error";
export const requires = [];
export const nativeRequires = [];
export const name = MODULE;

export class RuntimeError extends Error {
  constructor(msg, stack) {
    super(msg);
    this.name = "exn:runtime";
    if (stack) {
      this.stack = stack;
    }
  }

  toString() {
    return String(this.stack ? this.stack : this.message);
  }
}

export class TyError extends RuntimeError {
  constructor(expected, got, stack) {
    super(`Expected a value of type ${expected}, got ${got}`);
    this.name = "exn:type";
    if (stack) {
      this.stack = stack;
    }
  }
}

export class RefError extends RuntimeError {
  /**
   * Error for when name is accessed without being initialized in the current scope
   * @param {String} name
   */
  constructor(name, stack) {
    super(`ReferenceError: ${name} is not defined`);
    this.name = "exn:reference";
    if (stack) {
      this.stack = stack;
    }
  }
}

export class OutOfRangeError extends RuntimeError {
  constructor(index, stack) {
    super(`Index ${index} out of range`);
    this.name = "exn:out-of-range";
    if (stack) {
      this.stack = stack;
    }
  }
}

export class ArgumentsError extends RuntimeError {
  constructor(name, expected, got, stack) {
    super(`${name} expects ${expected} arguments; got ${got}`);
    this.name = "exn:arguments";
    if (stack) {
      this.stack = stack;
    }
  }
}

export class ValError extends RuntimeError {
  constructor(msg, stack) {
    super(msg);
    this.name = "exn:value";
    if (stack) {
      this.stack = stack;
    }
  }
}

export const module = (runtime) => {
  const fail = (msg) => {
    throw new RuntimeError(msg);
  };

  return makeModule(name, {
    fail: makeFunction(fail, MODULE),
    "exn:reference": makeFunction(
      (name) => {
        throw new RefError(name);
      },
      MODULE,
      { name: "exn:reference" }
    ),
    "exn:type": makeFunction(
      (ex, g) => {
        throw new TyError(ex, g);
      },
      MODULE,
      { name: "exn:type" }
    ),
    "exn:out-of-range": makeFunction(
      (i) => {
        throw new OutOfRangeError(i);
      },
      MODULE,
      { name: "exn:out-of-range" }
    ),
    "exn:arguments": makeFunction(
      (n, e, g) => {
        throw new ArgumentsError(n, e, g);
      },
      MODULE,
      { name: "exn:arguments" }
    ),
    "exn:value": makeFunction(
      (msg) => {
        throw new ValError(msg);
      },
      MODULE,
      { name: "exn:value" }
    ),
  });
};
