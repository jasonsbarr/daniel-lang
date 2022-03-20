import { makeFunction, makeModule } from "../../src/runtime.js";
import { getType } from "./base.js";

export const requires = [];
export const nativeRequires = ["error", "io"];
export const name = "string";

export const module = (runtime, err, io) => {
  const string = (obj) => io["print-str"](obj);

  const isString = (obj) => typeof obj === "string";

  const checkString = (obj, f) => {
    if (!isString(obj)) {
      err["exn:type"]("string", getType(obj));
    }
  };

  const stringEq = (a, b) => {
    checkString(a, "string=");
    checkString(b, "string=");

    return a === b;
  };

  const stringAppend = (s1, s2) => {
    checkString(s1, "string-append");
    checkString(s2, "string-append");

    return s1 + s2;
  };

  return makeModule(name, {
    string: makeFunction(string, name),
    "string?": makeFunction(isString, name, { name: "string?" }),
    "string=": makeFunction(stringEq, name, { name: "string=" }),
    substring: makeFunction(
      (str, s, e) => {
        checkString(str);
        return str.slice(s, e);
      },
      name,
      {
        name: "substring",
      }
    ),
    "string-append": makeFunction(stringAppend, name, {
      name: "string-append",
    }),
  });
};
