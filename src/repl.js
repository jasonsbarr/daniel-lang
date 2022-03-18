const { input, println } = require("../lib/js/io.js");
const read = require("./reader/reader.js");
const evaluate = require("./interpreter/evaluate.js");

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
