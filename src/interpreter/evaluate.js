import hash from "object-hash";
import { getType } from "../../lib/js/base.js";
import { RuntimeError, TyError, ValError } from "../../lib/js/error.js";
import { Environment } from "./environment.js";
import { isTruthy, isIterable } from "./utils.js";
import { makeFunction } from "../runtime.js";
import { evalModule, evalProvide, evalOpen, evalImport } from "./module.js";

let ID = 0;

/**
 *
 * @param {Object|Object[]} ast
 * @param {Environment} env
 * @param {String} module
 */
export const evaluateAndGetEnv = async (ast, env, module) => {
  evaluate(ast, env, module);
  return env;
};

const primitives = [
  "ListPattern",
  "HashPattern",
  "Symbol",
  "Number",
  "String",
  "Boolean",
  "Nil",
  "Keyword",
];

/**
 *
 * @param {Object|Object[]} ast
 * @param {Environment} env
 * @param {String} module
 * @returns
 */
export const evaluate = async (ast, env, module = "<main>") => {
  if (Array.isArray(ast)) {
    return await evalList(ast, env, module);
  }

  if (!primitives.includes(ast.type)) {
    // is already evaluated
    return ast;
  }

  switch (ast.type) {
    case "ListPattern":
      return evalListLiteral(ast, env, module);

    case "HashPattern":
      return evalHashLiteral(ast, env, module);

    case "Symbol":
      return evalSymbol(ast, env, module);

    case "Number":
    case "String":
    case "Boolean":
    case "Nil":
    case "Keyword":
      return ast.value;

    default:
      throw new RuntimeError(
        `Unknown expression type ${ast.type} at ${ast.file} ${ast.line}:${ast.col}`
      );
  }
};

/**
 *
 * @param {Object[]} ast
 * @param {Environment} env
 * @param {String} module
 * @returns
 */
const evalList = async (ast, env, module) => {
  if (ast.length === 0) {
    return null;
  }

  const fst = ast[0];

  switch (fst.value) {
    case "begin":
      return await evalBlock(ast.slice(1), env, module);

    case "begin-module":
      return await evalModule(ast[0], env, evaluate);

    case "provide":
      return await evalProvide(ast, env, module, evaluate);

    case "open":
      return await evalOpen(ast, env, module, evaluate);

    case "import":
      return await evalImport(ast, env, module, evaluate);

    case "if":
      return await evalIf(ast, env, module);

    case "for":
      return await evalFor(ast, env, module);

    case "for/list":
      return await evalForList(ast, env, module);

    case "define":
      return await evalDefine(ast, env, module);

    case "set!":
      return await evalSet(ast, env, module);

    case "let":
      return await evalLet(ast, env, module);

    case "lambda":
      return await evalLambda(ast, env, module);

    default:
      return await evalCall(ast, env, module);
  }
};

/**
 *
 * @param {Object[]} ast
 * @param {Environment} env
 * @param {String} module
 * @returns
 */
const evalBlock = async (ast, env, module) => {
  let value;

  for (let exp of ast) {
    value = await evaluate(exp, env, module);
  }

  return value;
};

/**
 * Unpack a list into function arguments or another list
 * @param {Object|Object[]} list
 * @param {Environment} env
 * @param {String} module
 */
const unpackList = async (list, env, module) => {
  let items;

  if (Array.isArray(list)) {
    // is a call or other list expression
    items = evalList(list, en, module);
  } else if (list.type === "ListPattern") {
    items = list.values.map(async (i) => await evaluate(i, env, module));
  } else if (list.type === "Symbol") {
    items = await evaluate(list, env, module);
  } else {
    throw new RuntimeError("Argument to unpack must be a list");
  }

  return items;
};

/**
 *
 * @param {Object[]} ast
 * @param {Environment} env
 * @param {String} module
 * @returns
 */
const evalCall = async (ast, env, module) => {
  if (ast[0] === undefined) {
    return null;
  }

  const fst = await evaluate(ast[0], env, module);

  if (typeof fst !== "function") {
    throw new RuntimeError(
      `Expected a function that can be applied to arguments; got ${typeof fst}`
    );
  }

  const args = [];
  let unpack = false;

  for (let arg of ast.slice(1)) {
    if (arg.type === "Amp") {
      unpack = true;
      continue;
    }

    if (unpack === true) {
      args.push(...(await unpackList(arg, env, module)));
      unpack = false;
    } else {
      args.push(await evaluate(arg, env, module));
    }
  }

  return fst.call(null, ...args);
};

const evalSymbol = async (ast, env, module) => {
  const val = env.get(ast.value);
  return val;
};

const evalIf = async (ast, env, module) => {
  if (ast.length !== 4) {
    throw new RuntimeError("If expression must have exactly 3 subexpressions");
  }

  const cond = ast[1];
  const then = ast[2];
  const els = ast[3];

  if (isTruthy(await evaluate(cond, env, module))) {
    return await evaluate(then, env, module);
  }

  return await evaluate(els, env, module);
};

/**
 * Evaluate a for-expression (iteration)
 *
 * syntax: for -> (for (clause) (body))
 * clause -> id sequence
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalFor = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError("For expression must have exactly 2 subexpressions");
  }

  // clause = [id sequence]
  const clause = ast[1];
  const body = ast[2];
  let value;

  // for now, we'll just do iteration over a single sequence
  // later we may allow multiple clauses
  let [id, seq] = clause[0];
  let when;
  let unless;

  if (clause.length === 3) {
    let kw = await evaluate(clause[1], env, module);
    if (kw === Symbol.for(":when")) {
      when = clause[2];
    } else if (kw === Symbol.for(":unless")) {
      unless = clause[2];
    }
  }

  seq = await evaluate(seq, env, module);

  for (let item of seq) {
    let newEnv = env.extend(`forExpr${ID++}`, module, id.file);

    await assign([id, item], newEnv);

    if (when) {
      let test = await evaluate(when, newEnv, module);
      if (isTruthy(test)) {
        value = await evaluate(body, newEnv, module);
      }
    } else if (unless) {
      let test = await evaluate(unless, newEnv, module);
      if (!isTruthy(test)) {
        value = await evaluate(body, newEnv, module);
      }
    } else {
      value = evaluate(body, newEnv, module);
    }
  }

  return value;
};

/**
 * List comprehension
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalForList = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError(
      "List comprehension must have exactly 2 subexpressions"
    );
  }

  const clause = ast[1];
  const body = ast[2];
  let list = [];
  let [id, seq] = clause[0];
  let when;
  let unless;

  if (clause.length === 3) {
    let kw = await evaluate(clause[1], env, module);
    if (kw === Symbol.for(":when")) {
      when = clause[2];
    } else if (kw === Symbol.for(":unless")) {
      unless = clause[2];
    }
  }
  seq = await evaluate(seq, env, module);

  if (isIterable(seq)) {
    for (let item of seq) {
      let newEnv = env.extend(`for/listExpr${ID++}`, id.file);

      await assign([id, item], newEnv);

      if (when) {
        let test = await evaluate(when, newEnv, module);
        if (isTruthy(test)) {
          list.push(await evaluate(body, newEnv, module));
        }
      } else if (unless) {
        let test = await evaluate(unless, newEnv, module);
        if (!isTruthy(test)) {
          list.push(await evaluate(body, newEnv, module));
        }
      } else {
        list.push(test);
      }
    }
  } else {
    throw new TyError("iterable", getType(seq));
  }

  return list;
};

/**
 * Destructure a list into variable assignments
 * @param {Array*} left
 * @param {Array} right
 * @param {Environment} env
 */
const destructureList = (left, right, env) => {
  const names = left.value;
  const exprs = right.value;

  if (names.length > exprs.length) {
    throw new RuntimeError(
      `${names.length} identifiers but only ${exprs.length} values to unpack`
    );
  }

  let i = 0;
  let value;
  let rest = false;
  for (let name of names) {
    if (name.value === "&") {
      rest = true;
      continue;
    }

    if (rest) {
      if (names.slice(i + 1).length > 1) {
        throw new RuntimeError(
          "Can only have a single identifier after rest symbol"
        );
      }
      return assign([name, exprs.slice(i)], env);
    }

    value = assign([name, exprs[i]], env);
    i++;
  }

  // return the last value
  return value;
};

/**
 * Bind a value to a name
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 * @param {Boolean} def
 */
const assign = async (ast, env, module, def = true) => {
  const [id, expr] = ast;

  if (id.type === "ListPattern") {
    return destructureList(id, expr, env);
  }

  const name = id.value;

  if (def && env.inCurrent(name)) {
    throw new ValError(`Name ${name} has already been defined in this scope`);
  }

  if (Array.isArray(expr)) {
    // rest identifier present in destructuring list
    let list = [];
    for (let ex of expr) {
      list.push(await evaluate(ex, env, module));
    }

    env.set(name, list);
    return list;
  }

  const value = await evaluate(expr, env, module);
  env.set(name, value);
  return value;
};

/**
 * Define a new binding in the current environment
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalDefine = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError("Define must have exactly 2 subexpressions");
  }

  const id = ast[1];
  const expr = ast[2];

  if (Array.isArray(id)) {
    // is function definition
    const name = id[0].value;
    const args = id.slice(1);
    const func = await makeLambda(name, [args, expr], env, module);
    env.set(name, func);
    return func;
  }

  return await assign([id, expr], env, module);
};

/**
 * Define a new binding in the current environment
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalSet = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError("Define must have exactly 2 subexpressions");
  }

  return await assign(ast.slice(1), env, module, false);
};

/**
 * Evaluate a let expression
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalLet = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError("Let must have exactly 2 subexpressions");
  }

  const defns = ast[1];
  const body = ast[2];
  const newEnv = env.extend(`letExpr${ID++}`, module, defns[0][0].file);

  for (let defn of defns) {
    await assign(defn, newEnv, module);
  }

  return evaluate(body, newEnv, module);
};

/**
 * Evaluate a lambda expression to create a function
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 * @returns {Function}
 */
const evalLambda = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError(
      "Lambda expression must have exactly 2 subexpressions"
    );
  }

  const name = `lambda${ID++}`;
  return await makeLambda(name, ast.slice(1), env, module);
};

/**
 * Create function object
 * @param {String} name
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 * @returns {Function}
 */
const makeLambda = async (name, ast, env, module) => {
  const params = ast[0].map((t) => t.value);
  const body = ast[1];
  let varargs = params.includes("&");
  let arity = params.length;

  if (varargs) {
    arity -= 2;
  }

  const lambda = async (...args) => {
    const scope = env.extend(name, module, body[0].file);

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
  return makeFunction(lambda, module, { name, arity, varargs });
};

/**
 *
 * @param {Object} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalListLiteral = async (ast, env, module) => {
  let list = [];
  let unpack = false;

  for (let val of ast.value) {
    if (val.type === "Amp") {
      unpack = true;
      continue;
    }

    if (unpack === true) {
      list.push(...(await unpackList(val, env, module)));
      unpack = false;
    } else {
      list.push(await evaluate(val, env, module));
    }
  }

  return list;
};

const evalHashLiteral = (ast, env, module) => {
  if (ast.value.length % 2 !== 0) {
    throw new RuntimeError(
      "A hash literal must contain an even number of values as a series of key/value pairs"
    );
  }

  let hash = new Map();
  const values = ast.value;

  for (let i = 0; i < values.length; i += 2) {
    let key = await evaluate(values[i], env, module);
    let val = await evaluate(values[i + 1], env, module);

    if (typeof key === "object" && key !== null) {
      key = hash(key);
    }

    hash.set(key, val);
  }

  return hash;
};
