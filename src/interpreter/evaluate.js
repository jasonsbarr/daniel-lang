export const evaluate = (ast, env = {}) => {
  if (Array.isArray(ast)) {
    return evalList(ast, env);
  }

  if (ast.type === "Symbol") {
    return evalSymbol(ast, env);
  }

  return ast.value;
};

const evalList = (ast, env) => {
  if (ast.length === 0) {
    return null;
  }

  const fst = ast[0];

  switch (fst.value) {
    case Symbol.for("begin"):
      return evalBlock(ast.slice(1), env);

    default:
      return evalCall(ast, env);
  }
};

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
