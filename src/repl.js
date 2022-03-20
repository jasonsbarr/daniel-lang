import { input, println } from "../lib/js/io.js";
import { read } from "./reader/reader.js";
import { evaluate } from "./interpreter/evaluate.js";
import { createEnv } from "./interpreter/environment.js";

const env = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => a / b,
  "%": (a, b) => a % b,
};

const globalEnv = createEnv();

for (let [k, v] of Object.entries(env)) {
  globalEnv.set(k, v);
}

const REP = (input) => println(evaluate(read(input, "<stdin>"), globalEnv));

while (true) {
  try {
    let line = input("daniel> ");
    if (line === "") break;
    if (line) REP(line);
  } catch (e) {
    console.log(e);
  }
}
