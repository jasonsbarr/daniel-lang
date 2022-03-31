import { makeModule } from "../../src/runtime.js";

export const requires = ["list", "core"];
export const nativeRequires = [
  "base",
  "error",
  "io",
  "lambda",
  "number",
  "string",
];
export const name = "global";

/**
 * The module function must be exported as module and requires parameters
 * of the runtime followed by any requires and native requires
 * as objects in that exact order.
 * @returns {Module}
 */
export const module = (
  runtime,
  list,
  core,
  base,
  err,
  io,
  lambda,
  num,
  str
) => {
  return makeModule(name, {
    ...list,
    ...core,
    ...base,
    ...err,
    ...io,
    ...lambda,
    ...num,
    ...str,
  });
};
