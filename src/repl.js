import { input, println } from "../lib/js/io.js";
import { read } from "./reader/reader.js";
import { evalInput } from "./eval.js";

const REP = (input) => println(evalInput(read(input, "<stdin>"), {}));

while (true) {
  try {
    let line = input("daniel> ");
    if (line === "") break;
    if (line) REP(line);
  } catch (e) {
    console.log(e);
  }
}
