import { makeModule } from "../../src/runtime.js";

const MODULE = "";
const requires = [];
const nativeRequires = [];
const URL = import.meta.url;

/**
 * The module function must be named module and requires parameters
 * of the runtime followed by any requires and native requires
 * as objects in that exact order.
 * @returns {Module}
 */

export const module = (runtime) => {
  return makeModule(MODULE, {}, URL, requires, nativeRequires);
};
