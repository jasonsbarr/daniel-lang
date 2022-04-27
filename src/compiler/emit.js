import { makeTable } from "./symbol-table.js";
import { gensym } from "../../lib/js/base.js";
import { transform } from "./transform.js";

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
        console.log(ast);
        return compileDefine(ast, names);

      case "lambda":
        return compileLambda(rest, names);

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

const compileCall = (ast, names) => {
  let [func, ...args] = ast;
  func = emit(func, names);
  args = args.map((node) => emit(node, names));

  return `(${func})(${args.join(", ")})`;
};

const mapVariable = (ident, names) => {
  const sym = gensym(`_${++syms}`);
  names.set(ident, sym);
  return sym;
};

const compileDefine = (ast, names) => {
  const [_, ident, value] = ast;

  if (Array.isArray(ident)) {
    return emit(transform(ast), names);
  }

  const sym = mapVariable(ident, names);

  return `let ${Symbol.keyFor(sym)} = ${emit(value, names)}`;
};

const compileLambda = (ast, names) => {
  let funcEnv = names.extend();
  let [params, body] = ast;

  params = params
    .map((param) => mapVariable(param, funcEnv))
    .map((param) => Symbol.keyFor(param));

  return `(${params.join(", ")}) => ${emit(body, funcEnv)}`;
};
