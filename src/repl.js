import { input, println } from "../lib/js/io.js";
import { read } from "./reader/reader.js";
import { evaluate } from "./interpreter/evaluate.js";

const REP = (input) => println(evaluate(read(input, "<stdin>"), {}));

while (true) {
  try {
    let line = input("daniel> ");
    if (line === "") break;
    if (line) REP(line);
  } catch (e) {
    console.log(e);
  }
}
