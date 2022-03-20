import { makeModule, makeFunction } from "../../src/runtime.js";
import { pipe, compose } from "../../src/utils.js";

export const requires = [];
export const nativeRequires = [];
export const name = "lambda";

export const module = makeModule(name, {
  "|>": makeFunction(pipe, name, { name: "|>", varargs: true, arity: 1 }),
  compose: makeFunction(compose, name, { varargs: true, arity: 1 }),
});
