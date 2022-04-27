import { read } from "../reader/reader.js";
import { makeSexprs } from "./s-expr.js";
import { emit } from "./emit.js";

export const compile = (code) => emit(makeSexprs(read(code)));
