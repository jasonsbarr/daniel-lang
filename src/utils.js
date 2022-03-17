import { dirname as dn } from "path";
import { pathToFileURL, fileURLToPath } from "url";

export const getFileURL = (path) => pathToFileURL(path).href;

export const dirname = (url) => dn(fileURLToPath(url));

export const defer = (fn) =>
  typeof "setImmediate" !== "undefined" ? setImmediate(fn) : setTimeout(fn, 0);
