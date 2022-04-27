const nameMap = {};

export const emit = (ast, names = nameMap) => {
  if (Array.isArray(ast)) {
    return compileList(ast, names);
  }

  if (typeof ast === "symbol") {
    console.log("symbol");
    return Symbol.keyFor(ast);
  } else if (typeof ast === "string") {
    return `"${ast}"`;
  }

  return String(ast);
};

const compileList = (ast, names) => {
  const [first, ...rest] = ast;

  if (Array.isArray(first)) {
    return (
      emit(first) + rest.reduce((code, node) => code + emit(node, names), "")
    );
  }

  if (typeof first === "symbol") {
    switch (Symbol.keyFor(first)) {
      case "begin":
        return compileBegin(rest, names);

      default:
        return compileCall(ast, names);
    }
  }

  throw new Error(`Unknown syntax ${String(first)}`);
};

const compileBegin = (ast, names) => {
  let code = "(() => {\n";

  let i = 0;
  for (let node of ast) {
    code += "    ";
    if (i === ast.length - 1) {
      code += `return ${emit(node, names)};\n`;
    } else {
      code += emit(node, names) + ";\n";
    }
    i++;
  }

  code += "})();";
  return code;
};

const compileCall = (ast, names) => {};
