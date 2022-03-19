import { pathToFileURL } from "url";

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
