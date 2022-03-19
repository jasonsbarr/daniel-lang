import { loadModules } from "../loader.js";
import { createEnv } from "./environment.js";

export const createGlobalEnv = () => {};

const modules = await loadModules({ name: "global", native: true });
console.log("global modules:", modules);
