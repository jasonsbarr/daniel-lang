import { makeTable } from "./symbol-table.js";
import { gensym } from "../../lib/js/base.js";

const nameMap = makeTable();
let syms = 0;

export const emit = (ast, names = nameMap) => {
  if (Array.isArray(ast)) {
    return compileList(ast, names);
  }

  if (typeof ast === "symbol") {
    return compileSymbol(ast, names);
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

      case "define":
        return compileDefine(rest, names);

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

const compileSymbol = (ast, names) => {
  const ident = names.get(ast);
  return Symbol.keyFor(ident);
};

const compileCall = (ast, names) => {};

const compileDefine = (ast, names) => {
  const [ident, value] = ast;
  const sym = gensym(`_${++syms}`);

  names.set(ident, sym);

  return `let ${Symbol.keyFor(sym)} = ${emit(value, names)}`;
};
