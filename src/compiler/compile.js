import { read } from "../reader/reader.js";
import { makeSexprs } from "./s-expr.js";
import { emit } from "./emit.js";
import { Visitor } from "./visitor.js";
import { rtUrl } from "../runtime.js";

class GenericVisitor extends Visitor {}

let visitor = new GenericVisitor();

let linkedGlobal = `
const runtime = await import("${rtUrl}");\n\n
const rt = runtime.createRuntime();
`;

export const compile = (code) =>
  linkedGlobal + emit(makeSexprs(visitor.visit(read(code))));
