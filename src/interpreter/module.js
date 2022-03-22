import { globals, modules } from "./global.js";

export const createMainModule = () => {
  return globals.extend("<main>", "<main>");
};

export const createModuleEnv = (name) => {
  return globals.extend(`<global>.${name}`, name);
};
