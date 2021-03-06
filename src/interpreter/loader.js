import { fileURLToPath } from "url";
import fs from "fs";
import { EVAL } from "../eval.js";
import {
  resolveRequire,
  resolveNativeRequire,
  createRuntime,
} from "../runtime.js";
import { Environment, createEnv } from "./environment.js";

let moduleTable = {};
let nameMap = {};
let modules = {};
const rt = createRuntime();
const globalEnv = createEnv();

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
    if (!(node in moduleTable) && !(node in modules)) {
      throw new Error(`Unknown module ${nameMap[node]}`);
    }

    if (node in currentlyVisited) {
      throw new Error(
        `You have a circular dependency that includes ${nameMap[node]}`
      );
    }

    if (node in visited) {
      // it's already been visited
      return;
    }

    if (node in modules) {
      // it's already been evaluated and loaded
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
    throw new Error(`Module constructor for ${name} is not a function type`);
  }

  if (url in moduleTable) {
    throw new Error(`Module ${name} already queued`);
  }

  moduleTable[url] = {
    name,
    url,
    deps,
    module,
  };
};

/**
 *
 * @param {String[]} depsOrder
 * @param {Environment}
 */
const evaluateModules = (
  depsOrder,
  env,
  { open = true, namespace = false, as } = {}
) => {
  for (let dep of depsOrder) {
    let deps = moduleTable[dep].deps;
    let mods = [];
    for (let d of deps) {
      // depsOrder starts with the root module and traverses the array
      // built up from the dependency graph, so each module is
      // guaranteed to have its dependencies already resolved
      mods.push(modules[d]);
    }
    // evaluate the module
    modules[dep] = moduleTable[dep].module(rt, ...mods);

    if (env && open) {
      env.bindModuleNames(modules[dep]);
    } else if (env && namespace) {
      env.bindModuleNamespaced(modules[dep], as);
    }
  }
};

/**
 * Load the dependencies for module {name} (the root module)
 * @param {Object} options
 * @param {String} options.name
 * @param {Environment} options.env
 * @returns
 */
export const loadModules = async ({
  name = "",
  env = globalEnv,
  url = null,
  open = true,
  namespace = false,
  as = null,
} = {}) => {
  let moduleURL = url ? url : "";

  if (moduleURL === "") {
    if (fs.existsSync(fileURLToPath(resolveNativeRequire(name)))) {
      moduleURL = resolveNativeRequire(name);
    } else if (fs.existsSync(fileURLToPath(resolveRequire(name)))) {
      moduleURL = resolveRequire(name);
    } else {
      throw new Error(
        `Could not resolve file URL for ${name || "unknown module"}`
      );
    }
  }

  nameMap[moduleURL] = name;

  // populate moduleTable with dependency tree
  const defineModule = async (moduleURL) => {
    let mName, requires, nativeRequires, module;

    if (moduleURL.endsWith(".js")) {
      // check if is native (JS) module
      ({
        name: mName,
        requires,
        nativeRequires,
        module,
      } = await import(moduleURL));
    } else if (moduleURL.endsWith(".dan")) {
      const filePath = fileURLToPath(moduleURL);
      const fileName = filePath.split("/").pop();
      const moduleName = fileName.split(".")[0];
      const input = fs.readFileSync(filePath, "utf-8");

      nameMap[moduleURL] = mName ?? moduleName;

      ({
        name: mName,
        requires,
        nativeRequires,
        module,
      } = await EVAL(input, {
        file: filePath,
        module: mName ?? moduleName,
        env,
      }));
    } else {
      throw new Error("A module must be either a .js or .dan file");
    }

    const rootDeps = getModuleURLs(requires, nativeRequires);

    if (!(moduleURL in moduleTable)) {
      define(name || moduleName, moduleURL, rootDeps, module);
    }

    for await (let dep of rootDeps) {
      let url = dep;
      await defineModule(url);
    }
  };

  await defineModule(moduleURL);
  const loadOrder = getLoadOrder([moduleURL]);
  evaluateModules(loadOrder, env, { open, namespace, as });

  return modules;
};

export const createGlobalEnv = async () => {
  await loadModules({ name: "global", env: globalEnv });

  return globalEnv;
};

/**
 * Bind the provides of an opened module into another module's environment
 * @param {Environment} env
 */
export const bindOpensToModuleEnv = async (env, name, url) => {
  await loadModules({ env, name, url });

  return env;
};

export const bindNamespacedModuleValues = async (env, name, url, as = null) => {
  await loadModules({ env, name, url, open: false, namespace: true, as });

  return env;
};
