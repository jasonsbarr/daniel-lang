import { createEnv } from "./environment.js";
import { getAllOwnKeys } from "../utils.js";

export const createGlobalEnv = (modules) => {
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
