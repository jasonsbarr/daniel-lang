import { makeModule } from "../../src/runtime.js";

const MODULE = "";
const URL = "builtins://base";
const requires = [];
const nativeRequires = [];

/**
 * The module function must be exported as module and requires parameters
 * of the runtime followed by any requires and native requires
 * as objects in that exact order.
 * @returns {Module}
 */

const theModule = (runtime) => {
  return makeModule(MODULE, URL, {});
};

/**
 * The file should export at least module: theModule, requires, and nativeRequires
 */
module.exports = {
  module: theModule,
  requires,
  nativeRequires,
};
