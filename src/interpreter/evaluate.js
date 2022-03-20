import { getType } from "../../lib/js/base.js";
import { RuntimeError, TyError } from "../../lib/js/error.js";
import { Environment } from "./environment.js";
import { isTruthy, isIterable } from "./utils.js";

let ID = 0;

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

  if (ast.type === "Symbol") {
    return evalSymbol(ast, env);
  }

  return ast.value;
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

  const args = ast.slice(1).map((arg) => evaluate(arg, env));

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
  const clauses = ast[1];
  const body = ast[2];
  let value;

  // for now, we'll just do iteration over a single sequence
  // later we may allow multiple clauses
  let [id, seq] = clauses[0];
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
