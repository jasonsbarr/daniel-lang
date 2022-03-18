const readlineSync = require("readline-sync");
const { makeFunction, makeModule } = require("../../src/runtime.js");

const MODULE = "io";
const URL = "builtins://io";
const requires = [];
const nativeRequires = [];

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

const println = (input) => process.stdout.write(printStr(input)) + "\n";

/**
 * All modules should export a function called "module" that returns a Daniel
 * module object. This function should take as its parameter in order:
 * @returns {Function} A function that returns a Daniel module
 */
const theModule = (runtime) => {
  return makeModule(
    MODULE,
    URL,
    {
      readline: makeFunction(readline, MODULE),
      input: makeFunction(input, MODULE),
      "print-str": makeFunction(printStr, MODULE, { name: "print-str" }),
      print: makeFunction(print, MODULE),
      println: makeFunction(println, MODULE),
    },
    requires,
    nativeRequires
  );
};

module.exports = {
  readline,
  input,
  printStr,
  print,
  println,
  module: theModule,
  requires,
  nativeRequires,
};
