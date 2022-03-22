import { read } from "./reader/reader.js";
import { evaluate, evaluateAndGetEnv } from "./interpreter/evaluate.js";
import { createMainModule } from "./interpreter/module.js";

const main = createMainModule();

export const EVAL = (
  input,
  { env = main, file = "<stdin>", module = "<main>" } = {}
) => {
  return evaluate(read(input, file), env);
};

export const EVAL_ENV = (
  input,
  { env = main, file = "<stdin>", module = "<main>" } = {}
) => {
  return evaluateAndGetEnv(read(input, file), env);
};
