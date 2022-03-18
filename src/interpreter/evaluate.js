export const evaluate = (ast, env = {}) => {
  if (Array.isArray(ast)) {
    return evalList(ast, env);
  }

  return ast.value;
};
