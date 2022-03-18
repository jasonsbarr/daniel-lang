const { dirname: dn } = require("path");
const { pathToFileURL, fileURLToPath } = require("url");

const getFileURL = (path) => pathToFileURL(path).href;

const dirname = (url) => dn(fileURLToPath(url));

const defer = (fn) =>
  typeof "setImmediate" !== "undefined" ? setImmediate(fn) : setTimeout(fn, 0);

const all =
  (fn, init) =>
  (...list) =>
    list.reduce(fn, init);

module.exports = {
  getFileURL,
  dirname,
  defer,
  all,
};
