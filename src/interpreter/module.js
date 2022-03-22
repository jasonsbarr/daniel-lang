import { globals, modules } from "./global.js";
import { Environment } from "./environment.js";
import { makeModule } from "../runtime.js";
import { RuntimeError, ArgumentsError } from "../../lib/js/error.js";

export const createMainModule = (file = "<stdin>") => {
  return globals.extend("<main>", "<main>", file);
};

export const createModuleEnv = (name, file) => {
  return globals.extend(`<global>.${name}`, name, file);
};

/**
 * Evaluate a module form into a module object with function
 * "module" that returns the module's exports
 * @param {Object[]} ast
 * @param {Environment} env
 * @param {Function} evaluate
 */

export const evalModule = (ast, env, evaluate) => {
  if (ast.length < 3) {
    throw new RuntimeError(
      "A module must contain a name and at least one expression"
    );
  }
  const { file } = ast[0];
  const { value: name } = ast[1];
  const exprs = ast.slice(2);
  let provides = {};
  let requires = [];
  let nativeRequires = [];

  if (typeof name !== "string") {
    throw new RuntimeError("A module name must be a string");
  }

  const moduleEnv = module.extend(`${env.name}.${name}`, name, file);

  for (let exp of exprs) {
    let value = evaluate(exp, moduleEnv, name);

    if (value.provide) {
      provides[value.name] = value.export;
    }
  }

  return {
    module: makeModule(name, provides),
    requires,
    nativeRequires,
    name,
  };
};

export const evalProvide = (ast, env, module, evaluate) => {
  const name = ast[1];
  if (name && name.type !== "Symbol") {
    throw new ArgumentsError(
      "provide",
      "a symbol that evaluates to a value or function",
      name.type
    );
  }
  return {
    name: name.value,
    provide: true,
    export: evaluate(name, env, module),
  };
};

export const evalOpen = (ast, env, module, evaluate) => {};
