import readlineSync from "readline-sync";
import { makeFunction, makeModule } from "../../src/runtime.js";

const MODULE = "builtin:io";
const URL = import.meta.url;
const requires = [];
const nativeRequires = [];

export const readline = () => readlineSync.question("");

export const input = (prompt) => readlineSync.question(prompt);

export const printStr = (...args) => {
  let str = "";

  for (let arg of args) {
    if (arg === null || arg === undefined) {
      str += "nil";
    } else if (Array.isArray(arg)) {
      str += "(";

      for (let item of arg) {
        str += `${printStr(item)} `;
      }

      str += `${str.slice(0, -1)})`;
    } else if (arg instanceof Map) {
      str += "{";

      for (let [k, v] of arg) {
        str += `${printStr(k)} => ${printStr(v)} `;
      }

      str += `${str.slice(0, -1)}}`;
    } else {
      str += arg.toString();
    }
  }

  return str;
};

export const print = (input) => process.stdout.write(printStr(input));

export const println = (input) => console.log(printStr(input));

/**
 * All modules should export a function called "module" that returns a Daniel
 * module object. This function should take as its parameter in order:
 * @returns {Function} A function that returns a Daniel module
 */
export const module = () => {
  return makeModule(
    MODULE,
    {
      readline: makeFunction(readline, { module: MODULE }),
      input: makeFunction(input, { module: MODULE }),
      "print-str": makeFunction(printStr, {
        name: "print-str",
        varargs: true,
        module: MODULE,
      }),
      print: makeFunction(print, { module: MODULE }),
      println: makeFunction(println, { module: MODULE }),
    },
    URL,
    { requires, nativeRequires }
  );
};
