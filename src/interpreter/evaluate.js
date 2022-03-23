import { getType } from "../../lib/js/base.js";
import { RuntimeError, TyError, ValError } from "../../lib/js/error.js";
import { Environment } from "./environment.js";
import { isTruthy, isIterable } from "./utils.js";
import { makeFunction } from "../runtime.js";

let ID = 0;

/**
 *
 * @param {Object|Object[]} ast
 * @param {Environment} env
 */
export const evaluateAndGetEnv = (ast, env) => {
  evaluate(ast, env);
  return env;
};

/**
 *
 * @param {Object|Object[]} ast
 * @param {Environment} env
 * @returns
 */
export const evaluate = (ast, env) => {
  if (Array.isArray(ast)) {
    return evalList(ast, env);
  }

  switch (ast.type) {
    case "ListPattern":
      return evalListLiteral(ast, env);

    case "Symbol":
      return evalSymbol(ast, env);

    case "Number":
    case "String":
    case "Boolean":
    case "Nil":
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
 * @returns
 */
const evalList = (ast, env) => {
  if (ast.length === 0) {
    return null;
  }

  const fst = ast[0];

  switch (fst.value) {
    case "begin":
      return evalBlock(ast.slice(1), env);

    case "if":
      return evalIf(ast, env);

    case "for":
      return evalFor(ast, env);

    case "for/list":
      return evalForList(ast, env);

    case "define":
      return evalDefine(ast, env);

    case "set!":
      return evalSet(ast, env);

    case "let":
      return evalLet(ast, env);

    case "lambda":
      return evalLambda(ast, env);

    default:
      return evalCall(ast, env);
  }
};

/**
 *
 * @param {Object[]} ast
 * @param {Environment} env
 * @returns
 */
const evalBlock = (ast, env) => {
  let value;

  for (let exp of ast) {
    value = evaluate(exp, env);
  }

  return value;
};

/**
 * Unpack a list into function arguments or another list
 * @param {Object|Object[]} list
 * @param {Environment} env
 */
const unpackList = (list, env) => {
  let items;

  if (Array.isArray(list)) {
    // is a call or other list expression
    items = evalList(list, env);
  } else if (list.type === "ListPattern") {
    items = list.values.map((i) => evaluate(i, env));
  } else if (list.type === "Symbol") {
    items = evaluate(list, env);
  } else {
    throw new RuntimeError("Argument to unpack must be a list");
  }

  return items;
};

/**
 *
 * @param {Object[]} ast
 * @param {Environment} env
 * @returns
 */
const evalCall = (ast, env) => {
  if (ast[0] === undefined) {
    return null;
  }

  const fst = evaluate(ast[0], env);

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
      args.push(...unpackList(arg, env));
      unpack = false;
    } else {
      args.push(evaluate(arg, env));
    }
  }

  return fst.call(null, ...args);
};

const evalSymbol = (ast, env) => {
  const val = env.get(ast.value);
  return val;
};

const evalIf = (ast, env) => {
  if (ast.length !== 4) {
    throw new RuntimeError("If expression must have exactly 3 subexpressions");
  }

  const cond = ast[1];
  const then = ast[2];
  const els = ast[3];

  if (isTruthy(evaluate(cond, env))) {
    return evaluate(then, env);
  }

  return evaluate(els, env);
};

/**
 * Evaluate a for-expression (iteration)
 *
 * syntax: for -> (for (clause) (body))
 * clause -> id sequence
 * @param {Array} ast
 * @param {Environment} env
 */
const evalFor = (ast, env) => {
  if (ast.length !== 3) {
    throw new RuntimeError("For expression must have exactly 2 subexpressions");
  }

  // clause = [id sequence]
  const clause = ast[1];
  const body = ast[2];
  let value;

  // for now, we'll just do iteration over a single sequence
  // later we may allow multiple clauses
  let [id, seq] = clause;
  id = id.value;
  seq = evaluate(seq, env);

  if (isIterable(seq)) {
    for (let item of seq) {
      let newEnv = env.extend(`forExpr${ID++}`);

      newEnv.set(id, item);
      value = evaluate(body, newEnv);
    }
  } else {
    throw new TyError("iterable", getType(seq));
  }

  return value;
};

/**
 * List comprehension
 * @param {Array} ast
 * @param {Environment} env
 */
const evalForList = (ast, env) => {
  if (ast.length !== 3) {
    throw new RuntimeError(
      "List comprehension must have exactly 2 subexpressions"
    );
  }

  const clause = ast[1];
  const body = ast[2];
  let list = [];
  let [id, seq] = clause;
  id = id.value;
  seq = evaluate(seq, env);

  if (isIterable(seq)) {
    for (let item of seq) {
      let newEnv = env.extend(`for/listExpr${ID++}`);
      newEnv.set(id, item);
      let value = evaluate(body, newEnv);
      if (value !== null && value !== undefined) {
        list.push(value);
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
const destructureList = (left, right, env, module, define) => {
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
      return assign([name, exprs.slice(i)], env, module, define, true);
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
 * @param {Boolean} def
 */
const assign = (ast, env, module, def = true, rest = false) => {
  const [id, expr] = ast;

  if (id.type === "ListPattern") {
    return destructureList(id, expr, env);
  }

  const name = id.value;

  if (def && env.inCurrent(name)) {
    throw new ValError(`Name ${name} has already been defined in this scope`);
  }

  if (Array.isArray(expr) && rest) {
    // rest identifier present in destructuring list
    let list = [];
    for (let ex of expr) {
      list.push(evaluate(ex, env));
    }

    env.set(name, list);
    return list;
  }

  const value = evaluate(expr, env);
  env.set(name, value);
  return value;
};

/**
 * Define a new binding in the current environment
 * @param {Array} ast
 * @param {Environment} env
 */
const evalDefine = (ast, env) => {
  if (ast.length !== 3) {
    throw new RuntimeError("Define must have exactly 2 subexpressions");
  }

  const id = ast[1];
  const expr = ast[2];

  if (Array.isArray(id)) {
    // is function definition
    const name = id[0].value;
    const args = id.slice(1);
    return env.set(name, makeLambda(name, [args, expr], env));
  }

  return assign([id, expr], env);
};

/**
 * Define a new binding in the current environment
 * @param {Array} ast
 * @param {Environment} env
 */
const evalSet = (ast, env) => {
  if (ast.length !== 3) {
    throw new RuntimeError("Define must have exactly 2 subexpressions");
  }

  const id = ast[1];
  const expr = ast[2];
  const name = id.value;
  const scope = env.lookup(name);

  if (scope) {
    return assign(ast.slice(1), scope, false);
  } else {
    throw new RuntimeError(`${name} is not bound in the current scope`);
  }
};

/**
 * Evaluate a let expression
 * @param {Array} ast
 * @param {Environment} env
 */
const evalLet = (ast, env) => {
  if (ast.length !== 3) {
    throw new RuntimeError("Let must have exactly 2 subexpressions");
  }

  const defns = ast[1];
  const body = ast[2];
  const newEnv = env.extend(`letExpr${ID++}`);

  for (let defn of defns) {
    assign(defn, newEnv);
  }

  return evaluate(body, newEnv);
};

/**
 * Evaluate a lambda expression to create a function
 * @param {Array} ast
 * @param {Environment} env
 * @returns {Function}
 */
const evalLambda = (ast, env) => {
  if (ast.length !== 3) {
    throw new RuntimeError(
      "Lambda expression must have exactly 2 subexpressions"
    );
  }

  const name = `lambda${ID++}`;
  return makeLambda(name, ast.slice(1), env);
};

/**
 * Create function object
 * @param {String} name
 * @param {Array} ast
 * @param {Environment} env
 * @returns {Function}
 */
const makeLambda = (name, ast, env) => {
  const params = ast[0].map((t) => t.value);
  const body = ast[1];
  let varargs = params.includes("&");
  let arity = params.length;

  if (varargs) {
    arity -= 2;
  }

  const lambda = (...args) => {
    const scope = env.extend(name);

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

    return evaluate(body, scope);
  };
  return makeFunction(lambda, "<main>", { name, arity, varargs });
};

/**
 *
 * @param {Object} ast
 * @param {Environment} env
 */
const evalListLiteral = (ast, env) => {
  let list = [];
  let unpack = false;

  for (let val of ast.value) {
    if (val.type === "Amp") {
      unpack = true;
      continue;
    }

    if (unpack === true) {
      list.push(...unpackList(val, env));
      unpack = false;
    } else {
      list.push(evaluate(val, env));
    }
  }

  return list;
};
