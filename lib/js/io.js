const readlineSync = require("readline-sync");

const readline = () => readlineSync.question("");

const input = (prompt) => readlineSync.question(prompt);

const printStr = (arg) => {
  let str = "";

  if (arg === null || arg === undefined) {
    str += "nil";
  } else if (Array.isArray(arg)) {
    str += "(" + arg.map((i) => printStr(i)).join(" ") + ")";
  } else if (arg instanceof Map) {
    str +=
      "{" +
      [...arg].map(([k, v]) => `${printStr(k)} => ${printStr(v)}`).join(" ") +
      "}";
  } else if (typeof arg === "symbol") {
    str += Symbol.keyFor(arg);
  } else if (typeof arg === "string") {
    return `"${arg}"`;
  } else {
    str += arg.toString();
  }

  return str;
};

const print = (input) => process.stdout.write(printStr(input));

const println = (input) => console.log(printStr(input));

module.exports = {
  readline,
  input,
  printStr,
  print,
  println,
};
