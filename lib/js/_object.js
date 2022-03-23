import hash from "object-hash";
import { v4 } from "uuid";
import { RuntimeError } from "./error.js";

export const makeObject = (type, constructor, map) => {
  let obj = {
    _type: type,
    get type() {
      return this._type;
    },

    _constructor: constructor,
    get constructor() {
      return this._constructor;
    },

    _id: hash(v4()),

    toString() {
      return `{${this._type}: ${[...map.entries()]
        .map(([k, v]) => `${typeof k === "symbol" ? k.description : k} => ${v}`)
        .join(" ")}}`;
    },
  };

  Object.defineProperty(obj, "_type", {
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(obj, "_constructor", {
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(obj, "_id", {
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
