import { input, println } from "../lib/js/io.js";
import { EVAL } from "./eval.js";

const REP = (input) => println(EVAL(input));

while (true) {
  try {
    let line = input("daniel> ");
    if (line === "") break;
    if (line) REP(line);
  } catch (e) {
    console.log(e);
  }
}
