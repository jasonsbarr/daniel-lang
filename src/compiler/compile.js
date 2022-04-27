import { read } from "../reader/reader.js";
import { makeSexprs } from "./s-expr.js";
import { emit } from "./emit.js";
import { Visitor } from "./visitor.js";
import { rtUrl } from "../runtime.js";

class GenericVisitor extends Visitor {}

let visitor = new GenericVisitor();

let linkedGlobal = `
import * as runtime from "${rtUrl}";
const rt = runtime.createRuntime();\n
`;

export const compile = (code) =>
  linkedGlobal + emit(makeSexprs(visitor.visit(read(code))));
