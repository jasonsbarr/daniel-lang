import { makeModule } from "../../src/runtime.js";

export const MODULE = "global";
export const URL = "builtins://global";
export const requires = [];
export const nativeRequires = ["error", "io", "number"];
export const name = MODULE;

/**
 * The module function must be exported as module and requires parameters
 * of the runtime followed by any requires and native requires
 * as objects in that exact order.
 * @returns {Module}
 */
export const module = (runtime, err, io, num) => {
  return makeModule(
    MODULE,
    URL,
    { ...err, ...io, ...num },
    requires,
    nativeRequires
  );
};
