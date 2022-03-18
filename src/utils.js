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

/**
 * Shim for require since I don't want to rewrite everything using Node require
 * @param {String} mod Path or URL to module
 * @returns {Promise}
 */
export const require = async (mod) => import(mod);

module.exports = {
  getFileURL,
  defer,
  all,
  requireJs,
  isBrowser,
};
