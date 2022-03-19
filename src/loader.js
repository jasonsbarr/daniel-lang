import {
  STDIN,
  STDOUT,
  STDERR,
  resolveRequire,
  resolveNativeRequire,
} from "./runtime";

let moduleTable = {};
let nameMap = {};
let modules = {};

const getModuleURLs = (requires, nativeRequires) => {
  let urls = [];

  for (let req of requires) {
    let url = resolveRequire(req);
    nameMap[url] = req;
    urls.push(url);
  }

  for (let nReq of nativeRequires) {
    let url = resolveNativeRequire(nReq);
    nameMap[url] = nReq;
    urls.push(url);
  }

  return urls;
};

const getLoadOrder = (deps) => {};

const define = (name, url, deps, module) => {
  if (module === undefined || typeof module !== "function") {
    throw new Error("Module must be a function type");
  }

  if (url in moduleTable) {
    throw new Error(`Module ${name} already queued`);
  }

  moduleTable[url] = { name, url, deps, module, resolved: false };
};

export const loadModules = async (toLoad = []) => {
  return modules;
};
