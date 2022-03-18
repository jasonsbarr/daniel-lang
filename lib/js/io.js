const readlineSync = require("readline-sync");
const { makeFunction, makeModule } = require("../../src/runtime.js");

const MODULE = "builtin:io";
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

/**
 * All modules should export a function called "module" that returns a Daniel
 * module object. This function should take as its parameter in order:
 * @returns {Function} A function that returns a Daniel module
 */
const theModule = (runtime) => {
  return makeModule(
    MODULE,
    {
      readline: makeFunction(readline, { module: MODULE }),
      input: makeFunction(input, { module: MODULE }),
      "print-str": makeFunction(printStr, {
        name: "print-str",
        module: MODULE,
      }),
      print: makeFunction(print, { module: MODULE }),
      println: makeFunction(println, { module: MODULE }),
    },
    { requires, nativeRequires }
  );
};

const println = (input) => console.log(printStr(input));

module.exports = {
  readline,
  input,
  printStr,
  print,
  println,
  module: theModule,
};
