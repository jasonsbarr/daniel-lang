export const transform = (ast) => {
  const [first] = ast;

  if (typeof first === "symbol") {
    switch (Symbol.keyFor(first)) {
      case "define":
        return defineToLambda(ast);

      default:
        return ast;
    }
  }

  return ast;
};

const defineToLambda = (ast) => {
  const [def, decl, body] = ast;
  const [name, ...args] = decl;
  return [def, name, [Symbol.for("lambda"), args, body]];
};
