import { pathToFileURL } from "url";

export const getFileURL = (path) => pathToFileURL(path).href;
