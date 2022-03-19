import { loadModules } from "../loader.js";
import { createEnv } from "./environment.js";
import { getAllOwnKeys } from "../utils.js";

const modules = await loadModules({ name: "global", native: true });

export const createGlobalEnv = () => {
  const globalEnv = createEnv();

  for (let key of getAllOwnKeys(modules)) {
    if (key.endsWith("global.js")) {
      const globalModule = modules[key];
      for (let k of getAllOwnKeys(globalModule)) {
        globalEnv.set(k, globalModule[k]);
      }
    }
  }

  return globalEnv;
};

export const globals = createGlobalEnv();
