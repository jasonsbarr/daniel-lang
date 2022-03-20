import { makeFunction, makeModule } from "../../src/runtime.js";

export const requires = [];
export const nativeRequires = ["error", "io"];
export const name = "string";

export const module = (runtime, err, io) => {
  const string = (obj) => io["print-str"](obj);

  const isString = (obj) => typeof obj === "string";

  const checkString = (obj, f) => {
    if (!isString(obj)) {
      err.fail(`Arguments to ${f} must be of type string`);
    }
  };

  const stringEq = (a, b) => {
    checkString(a, "string=");
    checkString(b, "string=");

    return a === b;
  };

  return makeModule(name, {
    string: makeFunction(string, name),
    "string?": makeFunction(isString, name, { name: "string?" }),
    "string=": makeFunction(stringEq, name, { name: "string=" }),
  });
};
