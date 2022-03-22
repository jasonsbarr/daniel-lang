import { read } from "./reader/reader.js";
import { evaluate, evaluateAndGetEnv } from "./interpreter/evaluate.js";

export const EVAL = async (
  input,
  { env, file = "<stdin>", module = "<main>" } = {}
) => {
  return evaluate(read(input, file), env, module);
};

export const EVAL_ENV = async (
  input,
  { env, file = "<stdin>", module = "<main>" } = {}
) => {
  return evaluateAndGetEnv(read(input, file), env, module);
};
