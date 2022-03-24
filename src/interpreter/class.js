import { Environment } from "./environment.js";

/**
 * Evaluate a class expression
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 * @param {Function} evaluate
 * @param {Function} assign
 */
export const evalClass = async (ast, env, module, evaluate, assign) => {
  const { value: className, file } = ast[1].value;
  const classEnv = env.extend(className, module, file);
  let i = 2;
  let superClass;
  let traits = [];

  while (!Array.isArray(ast[i])) {
    // handle possible superclass and traits
    i++;
  }

  const defns = ast.slice(i);
  const publicMethods = new Map();
  const privateMethods = new Map();
  const staticMethods = new Map();
  const classVars = new Map();
  const attrs = [];

  for (let defn of defns) {
    let sym = defn[0];
    switch (sym.value) {
      case "define":

      case "new":

      case "init":

      default:
        let method;
        if (defn[1].type === "Keyword") {
          switch (defn[1].value) {
            case Symbol.for(":private"):

            case Symbol.for(":static"):

            default:
              "Whoops, wrong keyword! Throw error here.";
          }
        } else {
          // define public method;
        }
    }
  }

  return; // something
};

const evalTrait = () => {};

const evalSuper = () => {};

const evalDefine = () => {};

const evalNewDecl = () => {};

const evalInit = () => {};

const evalMethod = () => {};
