const evaluate = (ast, env = {}) => {
  if (Array.isArray(ast)) {
    return evalList(ast, env);
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
      return evalBegin(ast.slice(1), env);

    default:
      return null;
  }
};

const evalBegin = (ast, env) => {
  let value;

  for (let exp of ast) {
    value = evaluate(exp, env);
  }

  return value;
};

module.exports = evaluate;
