import { read } from "./reader/reader.js";
import { evaluate, evaluateAndGetEnv } from "./interpreter/evaluate.js";
import { globals } from "./interpreter/global.js";

export const EVAL = (input, { env = globals, file = "<stdin>" } = {}) =>
  evaluate(read(input, file), env);

export const EVAL_ENV = (input, { env = globals, file = "<stdin>" } = {}) =>
  evaluateAndGetEnv(read(input, file), env);
