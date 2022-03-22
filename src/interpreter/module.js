import { globals, modules } from "./global.js";

export const createMainModule = (file = "<stdin>") => {
  return globals.extend("<main>", "<main>", file);
};

export const createModuleEnv = (name, file) => {
  return globals.extend(`<global>.${name}`, name, file);
};
