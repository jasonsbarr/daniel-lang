import hash from "object-hash";
import { v4 } from "uuid";
import { makeMethod, makeClass } from "../runtime.js";
import { Environment } from "./environment.js";
import { RuntimeError, ArgumentsError } from "../../lib/js/error.js";
import { objectClass } from "../../lib/js/_object.js";

/**
 * Evaluate a class expression
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 * @param {Function} evaluate
 * @param {Function} assign
 */
export const evalClass = async (ast, env, module, evaluate, assign) => {
  let { value: className, file } = ast[1];
  let classEnv = env.extend(className, module, file);
  let i = 2;
  let superClass = objectClass;
  let traits = [];

  while (!Array.isArray(ast[i])) {
    if (ast[i].type === "Keyword") {
      if (ast[i].value === Symbol.for(":extends")) {
        i++;

        if (ast[i].type !== "Symbol") {
          throw new RuntimeError(
            "Extends keyword must be followed by a class name"
          );
        }

        superClass = classEnv.get(ast[i].value);

        if (superClass.type !== "Class") {
          throw new RuntimeError(
            "Extends keyword must be followed by a class name"
          );
        }
      }
    }
    i++;
  }

  let superObj = Object.create(superClass.proto);
  let defns = ast.slice(i);
  let publicMethods = new Map();
  let staticMethods = new Map();
  let classVars = new Map();
  let attrs = [];

  classEnv.set("super", superObj);

  for (let defn of defns) {
    let sym = defn[0];

    switch (sym.value) {
      case "define":
        let [name, value] = await evalDefine(defn, classEnv, module, assign);
        if (Array.isArray(name)) {
          if (!Array.isArray(value)) {
            throw new RuntimeError(
              "Destructured assignment requires a compound value (list, map, struct, or object)"
            );
          }
          let i = 0;
          for (let n of names) {
            classVars.set(n, value[i]);
            classEnv.set(n, value[i]);
            i++;
          }
        } else {
          classVars.set(name, value);
          classEnv.set(name, value);
        }
        break;

      // new and init are both executed in the class environment, they do not create their own environments
      case "new":
        let [names, newMethod] = await evalNewDecl(
          defn.slice(1),
          classEnv,
          module,
          evaluate,
          className,
          superClass
        );
        publicMethods.set("new", newMethod);
        attrs = names;
        break;

      case "init":
        let initMethod = await evalInit(
          defn[2], // only argument to init is this, so don't need the args array - it's just there to hold space
          classEnv,
          module,
          evaluate
        );
        publicMethods.set("init", initMethod);
        break;

      default:
        if (defn[1].type === "Keyword") {
          switch (defn[1].value) {
            case Symbol.for(":private"):
              break;

            case Symbol.for(":static"):
              break;

            default:
              throw new RuntimeError(
                `Unknown keyword ${defn[1].value.description} in class declaration`
              );
          }
        } else {
          // define public method;
          let name = defn[0].value;
          let method = await evalMethod(
            name,
            defn.slice(1),
            classEnv,
            module,
            evaluate,
            className,
            file
          );
          classEnv.set(name, method);
          publicMethods.set(name, method);
          break;
        }
    }
  }

  let klass = await makeClass(
    {
      name: className,
      superClass,
      classVars,
      publicMethods,
      staticMethods,
      attrs,
    },
    module
  );

  env.set(className, klass);
  return klass;
};

export const evalTrait = async (ast, env, module, evaluate) => {};

const evalDefine = async (ast, env, module, assign) => {
  let [id, expr] = ast.slice(1);
  let name =
    typeof id.value === "string" ? id.value : id.value.map((s) => s.value); // if not a string, it's an array of Symbol syntax objects
  let value = await assign([id, expr], env, module);

  return [name, value];
};

const evalNewDecl = async (
  ast,
  env,
  module,
  evaluate,
  className,
  superClass
) => {
  let names = [];
  for (let name of ast) {
    if (name.type !== "Keyword") {
      throw new RuntimeError("new expression only takes keyword arguments");
    }
    names.push(name.value.description.slice(1));
  }

  let allAttrs = superClass.attrs.concat(names);

  let newMethod = async (proto, ...args) => {
    if (args.length !== allAttrs.length) {
      throw new ArgumentsError(
        `new ${className}`,
        `${allAttrs.length}`,
        args.length
      );
    }

    let allArgs = [];

    for (let arg of args) {
      allArgs.push(await evaluate(arg, env, module));
    }

    let i = 0;
    let obj = Object.create(proto);

    obj.type = className;
    obj.id = hash(v4());
    obj.proto = proto;

    Object.defineProperty(obj, "type", {
      writable: false,
      configurable: false,
      enumerable: false,
    });

    Object.defineProperty(obj, "id", {
      writable: false,
      configurable: false,
      enumerable: false,
    });

    for (let arg of allArgs) {
      env.set(allAttrs[i], arg);
      obj[allAttrs[i]] = arg;
      i++;
    }

    env.set("this", obj);

    return obj;
  };

  return [
    names,
    makeMethod(newMethod, className, module, {
      name: "new",
      arity: allAttrs.length,
    }),
  ];
};

const evalInit = async (ast, env, module, evaluate, className) => {
  const initMethod = async (thisArg) => {
    await evaluate(ast, env, module);
    return thisArg;
  };

  return makeMethod(initMethod, className, module, { name: "init" });
};

const evalMethod = async (
  name,
  ast,
  env,
  module,
  evaluate,
  className,
  file
) => {
  let params = ast[0].map((t) => t.value);
  let body = ast[1];
  let varargs = params.includes("&");
  let arity = params.length;

  if (varargs) {
    arity -= 2;
  }

  const method = async (thisArg, ...args) => {
    let scope = env.extend(`${className}.${name}`, module, file);
    let varargs = false;

    if (params && params.length) {
      let i = 0;
      for (let param of params) {
        if (param === "&") {
          varargs = true;
          continue;
        }

        if (param === "this") {
          continue;
        }

        if (!varargs) {
          scope.set(param, args[i]);
        } else if (varargs) {
          scope.set(param, args.slice(i));
        }
        i++;
      }
    }

    return await evaluate(body, scope, module);
  };

  return makeMethod(method, className, module, { name, arity, varargs });
};
