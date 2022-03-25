import hash from "object-hash";
import { v4 } from "uuid";
import { RuntimeError } from "./error.js";
import { printStr } from "./io.js";

export const makeObject = (type, constructor, map) => {
  let obj = {
    type,
    constructor,
    id: hash(v4()),

    toString() {
      return `{${this.type}: ${[...Object.entries(this)]
        .map(
          ([k, v]) =>
            `${typeof k === "symbol" ? k.description : k} => ${printStr(v)}`
        )
        .join(" ")}}`;
    },
  };

  Object.defineProperty(obj, "type", {
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(obj, "constructor", {
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(obj, "id", {
    writable: false,
    configurable: false,
    enumerable: false,
  });

  Object.defineProperty(obj, "toString", {
    writable: false,
    configurable: false,
    enumerable: false,
  });

  if (map._keys) {
    for (let k in _keys) {
      if (typeof k === "object") {
        throw new RuntimeError("An object may only have string or symbol keys");
      }
    }
  }

  for (let [k, v] of map) {
    if (typeof k === "symbol" && k.description.startsWith(":")) {
      obj[k.description.slice(1)] = v;
    } else {
      obj[k] = v;
    }
  }

  return obj;
};

export const objectClass = { proto: { new: (obj) => obj }, attrs: [] };
