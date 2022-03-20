import { pathToFileURL, fileURLToPath } from "url";
import { dirname as dn } from "path";

export const getFileURL = (path) => pathToFileURL(path).href;

export const defer = (fn) =>
  typeof "setImmediate" !== "undefined" ? setImmediate(fn) : setTimeout(fn, 0);

export const all =
  (fn, init) =>
  (...list) =>
    list.reduce(fn, init);

/**
 * If not a browser, we'll assume the JS runtime is Node
 */
export const isBrowser = () => typeof window !== "undefined";

export const dirname = (url) => dn(fileURLToPath(url));

export const getAllOwnKeys = (obj) =>
  Object.keys(obj).concat(Object.getOwnPropertySymbols(obj));

export const isNil = (obj) => obj === null || obj === undefined;
