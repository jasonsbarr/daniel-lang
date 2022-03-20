import { makeModule } from "../../src/runtime.js";

export const MODULE = "global";
export const requires = [];
export const nativeRequires = ["base", "error", "io", "number", "string"];
export const name = MODULE;

/**
 * The module function must be exported as module and requires parameters
 * of the runtime followed by any requires and native requires
 * as objects in that exact order.
 * @returns {Module}
 */
export const module = (runtime, base, err, io, num, str) => {
  return makeModule(name, { ...base, ...err, ...io, ...num, ...str });
};
