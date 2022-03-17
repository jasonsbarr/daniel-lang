import { pathToFileURL, fileURLToPath } from "url";

export const getFileURL = (path) => pathToFileURL(path).href;

export const getURLFromPath = (url) => fileURLToPath(url);
