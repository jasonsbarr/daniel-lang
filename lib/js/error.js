import { makeModule, makeFunction } from "../../src/runtime.js";

const MODULE = "error";
export const requires = [];
export const nativeRequires = [];
export const name = MODULE;

class Exception extends Error {
  constructor(msg, stack) {
    super(msg);
    this.name = "exn";
    if (stack) {
      this.stack = stack;
    }
  }

  toString() {
    if (this.stack) {
      return this.stack;
    }
    return this.message;
  }
}
export class RuntimeError extends Exception {
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
    throw: makeFunction(
      (err) => {
        throw err;
      },
      MODULE,
      { name: "throw" }
    ),
    exn: makeFunction(
      (msg, stack) => {
        return new Exception(msg, stack);
      },
      MODULE,
      { arity: 1 }
    ),
    "exn:runtime": makeFunction(
      (msg, stack) => {
        return new RuntimeError(msg, stack);
      },
      MODULE,
      { name: "exn:runtime", arity: 1 }
    ),
    "exn:reference": makeFunction(
      (name, stack) => {
        return new RefError(name, stack);
      },
      MODULE,
      { name: "exn:reference", arity: 1 }
    ),
    "exn:type": makeFunction(
      (ex, g, stack) => {
        return new TyError(ex, g, stack);
      },
      MODULE,
      { name: "exn:type", arity: 2 }
    ),
    "exn:out-of-range": makeFunction(
      (i, stack) => {
        return new OutOfRangeError(i, stack);
      },
      MODULE,
      { name: "exn:out-of-range", arity: 1 }
    ),
    "exn:arguments": makeFunction(
      (n, e, g, stack) => {
        return new ArgumentsError(n, e, g, stack);
      },
      MODULE,
      { name: "exn:arguments", arity: 3 }
    ),
    "exn:value": makeFunction(
      (msg, stack) => {
        return new ValError(msg, stack);
      },
      MODULE,
      { name: "exn:value", arity: 1 }
    ),
  });
};
