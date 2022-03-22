import { read } from "./reader/reader.js";
import { evaluate, evaluateAndGetEnv } from "./interpreter/evaluate.js";
import { createMainModule } from "./interpreter/module.js";

export const EVAL = (
  input,
  { env, file = "<stdin>", module = "<main>" } = {}
) => {
  env = env ? env : createMainModule(file);
  return evaluate(read(input, file), env, module);
};

export const EVAL_ENV = (
  input,
  { env, file = "<stdin>", module = "<main>" } = {}
) => {
  console.log(file);
  env = env ? env : createMainModule(file);
  return evaluateAndGetEnv(read(input, file), env, module);
};
