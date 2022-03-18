const { input, print } = require("../lib/js/io.js");
const read = require("./reader/reader.js");
const evalInput = require("./eval.js");

const REP = (input) => print(evalInput(read(input), {}));

while (true) {
  try {
    let line = input("daniel> ");
    if (line === "") break;
    if (line) REP(line);
  } catch (e) {
    console.log(e);
  }
}
