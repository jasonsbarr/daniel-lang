import { makeModule } from "../../src/runtime.js";

const MODULE = "";
const requires = [];
const nativeRequires = [];

/**
 * The module function must be named module and requires parameters
 * of the runtime followed by any requires and native requires
 * as objects in that exact order.
 * @returns {Module}
 */

const theModule = (runtime) => {
  return makeModule(MODULE, {}, requires, nativeRequires);
};

module.exports = { theModule };
