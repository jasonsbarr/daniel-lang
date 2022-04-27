export const emit = (ast) => {
  if (Array.isArray(ast)) {
    return compileList(ast);
  }

  if (typeof ast === "symbol") {
    console.log("symbol");
    return Symbol.keyFor(ast);
  } else if (typeof ast === "string") {
    return `"${ast}"`;
  }

  return String(ast);
};

const compileList = (ast) => {
  const compileArray = (ast) =>
    ast.reduce((code, node) => code + emit(node), "");

  const [first, ...rest] = ast;

  if (Array.isArray(first)) {
    return emit(first) + compileArray(rest);
  }

  if (typeof first === "symbol") {
    switch (Symbol.keyFor(first)) {
      case "begin":
        return compileBegin(rest);

      default:
        throw new Error(`Unknown symbol ${Symbol.keyFor(first)}`);
    }
  }

  throw new Error(`Unknown syntax ${String(first)}`);
};

const compileBegin = (ast) => {
  let code = "(() => {\n";

  let i = 0;
  for (let node of ast) {
    code += "    ";
    if (i === ast.length - 1) {
      code += `return ${emit(node)};\n`;
    } else {
      code += emit(node) + ";\n";
    }
    i++;
  }

  code += "})();";
  return code;
};
