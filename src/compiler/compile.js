import { read } from "../reader/reader.js";
import { makeSexprs } from "./s-expr.js";
import { emit } from "./emit.js";
import { Visitor } from "./visitor.js";

class GenericVisitor extends Visitor {}

let visitor = new GenericVisitor();

export const compile = (code) => emit(makeSexprs(visitor.visit(read(code))));
