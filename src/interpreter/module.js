// import { globals } from "./global.js";
import { Environment } from "./environment.js";
import { makeModule, resolveImport } from "../runtime.js";
import { RuntimeError, ArgumentsError } from "../../lib/js/error.js";
import { bindOpensToModuleEnv, bindNamespacedModuleValues } from "./loader.js";

/**
 * Evaluate a module form into a module object with function
 * "module" that returns the module's exports
 * @param {Object} ast
 * @param {Environment} env
 * @param {Function} evaluate
 */

export const evalModule = async (ast, env, evaluate) => {
  if (ast.exprs.length < 2) {
    throw new RuntimeError(
      "A module must contain a name and at least one expression"
    );
  }
  const { file, value: name } = ast.exprs[0];
  const exprs = ast.exprs.slice(1);
  let provides = {};
  let requires = [];
  let nativeRequires = [];

  if (typeof name !== "string") {
    throw new RuntimeError("A module name must be a string");
  }

  const moduleEnv = env.extend(`${env.name}.${name}`, name, file);
  let i = 0;
  for (let exp of exprs) {
    let value = await evaluate(exp, moduleEnv, name);

    if (value && value.provide) {
      provides[value.name] = value.export;
    }
  }

  const module = () => makeModule(name, provides);

  return {
    module,
    requires,
    nativeRequires,
    name,
  };
};

export const evalProvide = (ast, env, module) => {
  const name = ast[1];
  if (name && name.type !== "Symbol") {
    throw new ArgumentsError(
      "provide",
      "a symbol that evaluates to a value or function",
      name.type
    );
  }

  const exportVal = env.get(name.value);
  exportVal.module = module;
  return {
    name: name.value,
    provide: true,
    export: exportVal,
  };
};

/**
 *
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 * @param {Function} evaluate
 * @returns
 */
export const evalOpen = async (ast, env) => {
  if (ast.length !== 2) {
    throw new RuntimeError(
      "Open expression must be the symbol open plus a value that resolves to a module"
    );
  }

  const [openSym, modVal] = ast;
  const modFile = resolveImport(modVal.value, openSym.file);
  const modName = modFile.split("/").pop().split(".")[0];

  await bindOpensToModuleEnv(env, modName, modFile);

  return null;
};

export const evalImport = async (ast, env, module) => {
  if (ast.length !== 2 && ast.length !== 4) {
    throw new RuntimeError(
      "Import expression must be the symbol open plus a value that resolves to a module, with optional :as clause"
    );
  }

  const [openSym, modVal, , as] = ast;
  const modFile = resolveImport(modVal.value, openSym.file);
  const modName = modFile.split("/").pop().split(".")[0];

  await bindNamespacedModuleValues(env, modName, modFile, as && as.value);

  return null;
};
