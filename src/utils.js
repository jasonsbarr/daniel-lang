import { dirname as dn } from "path";
import { pathToFileURL, fileURLToPath } from "url";

export const getFileURL = (path) => pathToFileURL(path).href;

export const dirname = (url) => dn(fileURLToPath(url));
