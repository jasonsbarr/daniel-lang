import hash from "object-hash";
import { makeModule, makeFunction } from "../../src/runtime.js";

export const requires = [];
export const nativeRequires = [];
export const name = "struct";

export const module = (runtime) => {
  return makeModule(name, {});
};
