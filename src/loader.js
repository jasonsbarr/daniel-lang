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

/**
 * Traverse the dependency graph and get the order in which to load modules
 * Inspiration from {@link https://github.com/brownplt/pyret-lang/blob/331e29e79cfc8d49fd3b73684dd3a034d445f5c5/src/js/base/amd_loader.js#L73}
 * @param {String[]} deps
 * @returns {String[]}
 */
const getLoadOrder = (deps) => {
  let sorted = [];
  let toVisit = {};
  let currentlyVisited = {};
  let visited = {};

  const visitNode = (node) => {
    if (!(node in moduleTable)) {
      throw new Error(`Unknown module ${nameMap[node]}`);
    }

    if (node in currentlyVisited) {
      throw new Error(
        `We have a circular dependency that includes ${nameMap[node]}`
      );
    }

    if (node in visited) {
      // it's already been visited
      return;
    }

    // it's unvisited, so mark it as currently being visited
    currentlyVisited[node] = true;
    if (node in toVisit) {
      delete toVisit[node];
    }

    // now visit its children
    for (let dep of moduleTable[node].deps) {
      visitNode(dep);
    }

    // now all of its dependencies will have been added to the list
    // so it's save to add it to the load order array
    sorted.push(node);
    delete currentlyVisited[node];
    visited[node] = true;
  };

  for (let dep of deps) {
    toVisit[dep] = true;
  }

  while (Object.keys(toVisit).length > 0) {
    let node = Object.keys(toVisit)[0];
    visitNode(node);
  }

  return sorted;
};

const define = (name, url, deps, module) => {
  if (module === undefined || typeof module !== "function") {
    throw new Error("Module must be a function type");
  }

  if (name in moduleTable) {
    throw new Error(`Module ${name} already queued`);
  }

  moduleTable[url] = {
    name,
    url,
    deps,
    module,
    resolved: false,
  };
};

/**
 * Load the dependencies for module {name} (the root module)
 * @param {String} name
 * @param {Boolean} native
 * @returns
 */
export const loadModules = async ({ name = "", native = true } = {}) => {
  let moduleURL = native ? resolveNativeRequire(name) : resolveRequire(name);

  // populate moduleTable with dependency tree
  const defineModule = (moduleURL) => {
    let { name, url, requires, nativeRequires, module } = await import(
      moduleURL
    );
    const rootDeps = getModuleURLs(requires, nativeRequires);
    define(name, url, rootDeps, module);

    for (let dep of rootDeps) {
      let url = dep;
      defineModule(url);
    }
  };

  defineModule(moduleURL);
  return modules;
};
