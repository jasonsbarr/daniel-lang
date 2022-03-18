const { pathToFileURL } = require("url");

const getFileURL = (path) => pathToFileURL(path).href;

const defer = (fn) =>
  typeof "setImmediate" !== "undefined" ? setImmediate(fn) : setTimeout(fn, 0);

const all =
  (fn, init) =>
  (...list) =>
    list.reduce(fn, init);

/**
 * If not a browser, we'll assume the JS runtime is Node
 */
const isBrowser = () => typeof window !== "undefined";

let requireJs;
if (!isBrowser()) {
  requireJs = (path) => require(path);
} else {
  requireJs = async (mod) => await import(mod);
}

module.exports = {
  getFileURL,
  defer,
  all,
  requireJs,
  isBrowser,
};
