import { globals, modules } from "./global.js";

export const createMainModule = () => {
  return globals.extend("<main>", "<main>");
};
