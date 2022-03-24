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
  const { value: className, file } = ast[1].value;
  const classEnv = env.extend(className, module, file);
  let i = 2;
  let superClass = objectClass;
  let traits = [];

  while (!Array.isArray(ast[i])) {
    // handle possible superclass and traits
    i++;
  }

  const superObj = Object.create(superClass.proto);
  const defns = ast.slice(i);
  const publicMethods = new Map();
  const privateMethods = new Map();
  const staticMethods = new Map();
  const classVars = new Map();
  const attrs = [];

  classEnv.set("super", superObj);

  for (let defn of defns) {
    let sym = defn[0];

    switch (sym.value) {
      case "define":
        let [name, value] = evalDefine(defn, classEnv, module, assign);
        if (Array.isArray(name)) {
          if (!Array.isArray(value)) {
            throw new RuntimeError(
              "Destructured assignment requires a compound value (list, map, struct, or object)"
            );
          }
          let i = 0;
          for (let n of names) {
            classVars.set(n, value[i]);
            i++;
          }
        } else {
          classVars.set(name, value);
        }
        break;

      // new and init are both executed in the class environment, they do not create their own environments
      case "new":
        let [names, newMethod] = evalNewDecl(
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
        let initMethod = evalInit(
          defn.slice(2), // only argument to init is this, so don't need the args array - it's just there to hold space
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
          const name = defn[0].value;
          const method = evalMethod(
            name,
            defn.slice(1),
            classEnv,
            module,
            evaluate,
            className,
            file
          );
          classEnv.set(name, method);
          break;
        }
    }
  }

  return makeClass(
    {
      name: className,
      super: superClass,
      classVars,
      publicMethods,
      privateMethods,
      staticMethods,
      attrs,
    },
    module
  );
};

export const evalTrait = async (ast, env, module, evaluate) => {};

const evalDefine = async (ast, env, module, assign) => {
  const [id, expr] = ast.slice(1);
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
  let attrs = superClass.attrs.concat(attrs);

  // don't forget to create proto object in the constructor function
  let newMethod = (proto, ...args) => {
    if (args.length < attrs.length) {
      throw new ArgumentsError(`new ${className}`, attrs.length, args.length);
    }

    let superArgs = args
      .slice(0, superClass.attrs.length)
      .map((arg) => evaluate(arg, env, module));

    let allArgs = superArgs.concat(
      args.slice(superArgs.length).map((arg) => evaluate(arg, env, module))
    );

    let i = 0;
    let obj = Object.create(proto);

    obj.type = className;
    obj.id = hash(v4());

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
      env.set(attrs[i], arg);
      obj[attrs[i]] = arg;
      i++;
    }

    env.set("this", obj);

    return obj;
  };

  return [
    names,
    makeMethod(newMethod, className, module, {
      name: "new",
      arity: attrs.length,
    }),
  ];
};

const evalInit = async (ast, env, module, evaluate, className) => {
  const initMethod = (thisArg) => {
    return await evaluate(ast, env, module);
  };

  return makeMethod(initMethod, className, module, { name: "init" });
};

const evalMethod = async (name, ast, env, module, evaluate, className) => {
  const params = ast[0].map((t) => t.value);
  const body = ast[1];
  let varargs = params.includes("&");
  let arity = params.length;

  if (varargs) {
    arity -= 2;
  }

  const method = (thisArg, ...args) => {
    let scope = env.extend(`${className}.${name}`, module, file);
    let varargs = false;

    if (params && params.length) {
      let i = 0;
      for (let param of params) {
        if (param === "&") {
          varargs = true;
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
