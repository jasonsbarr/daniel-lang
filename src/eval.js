import { read } from "./reader/reader.js";
import { evaluate } from "./interpreter/evaluate.js";
import { globals } from "./interpreter/global.js";

export const EVAL = (input, { env = globals, file = "<stdin>" } = {}) =>
  evaluate(read(input, file), env);
