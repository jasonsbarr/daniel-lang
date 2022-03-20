import { graphemes } from "@chopinlang/string-utils";
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

  const stringLt = (s1, s2) => {
    checkString(s1);
    checkString(s2);

    return s1 < s2;
  };

  const stringLte = (s1, s2) => {
    checkString(s1);
    checkString(s2);

    return s1 <= s2;
  };

  const stringGt = (s1, s2) => {
    checkString(s1);
    checkString(s2);

    return s1 > s2;
  };

  const stringGte = (s1, s2) => {
    checkString(s1);
    checkString(s2);

    return s1 >= s2;
  };

  const stringCiEq = (s1, s2) => {
    checkString(s1);
    checkString(s2);

    return s1.toLowerCase() === s2.toLowerCase();
  };

  const stringCiLt = (s1, s2) => {
    checkString(s1);
    checkString(s2);

    return s1.toLowerCase() < s2.toLowerCase();
  };

  const stringCiLte = (s1, s2) => {
    checkString(s1);
    checkString(s2);

    return s1.toLowerCase() <= s2.toLowerCase();
  };

  const stringCiGt = (s1, s2) => {
    checkString(s1);
    checkString(s2);

    return s1.toLowerCase() > s2.toLowerCase();
  };

  const stringCiGte = (s1, s2) => {
    checkString(s1);
    checkString(s2);

    return s1.toLowerCase() >= s2.toLowerCase();
  };

  const stringAppend = (s1, s2) => {
    checkString(s1, "string-append");
    checkString(s2, "string-append");

    return s1 + s2;
  };

  const toList = (str) => {
    checkString(str, "chars");
    return [...str];
  };

  return makeModule(name, {
    string: makeFunction(string, name),
    "string?": makeFunction(isString, name, { name: "string?" }),
    "string=?": makeFunction(stringEq, name, { name: "string=?" }),
    "string<?": makeFunction(stringLt, name, { name: "string<?" }),
    "string<=?": makeFunction(stringLtr, name, { name: "string<=?" }),
    "string>?": makeFunction(stringGt, name, { name: "string>?" }),
    "string>=?": makeFunction(stringGte, name, { name: "string>=?" }),
    "string-ci=?": makeFunction(stringCiEq, name, { name: "string-ci=?" }),
    "string-ci<?": makeFunction(stringCiLt, name, { name: "string-ci<?" }),
    "string-ci<=?": makeFunction(stringCiLte, name, { name: "string-ci<=?" }),
    "string-ci>?": makeFunction(stringCiGt, name, { name: "string-ci>=?" }),
    "string-ci>=?": makeFunction(stringCiGte, name, { name: "string-ci>=?" }),
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
    "string->list": makeFunction(toList, name, { name: "string->list" }),
    graphemes: makeFunction(graphemes, name),
  });
};
