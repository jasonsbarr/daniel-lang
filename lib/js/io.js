import readlineSync from "readline-sync";
import { makeFunction, makeModule } from "../../src/runtime.js";

const MODULE = "builtin:io";
const URL = import.meta.url;
const requires = [];
const nativeRequires = [];

export const readline = () => readlineSync.question("");

export const input = (prompt) => readlineSync.question(prompt);

export const print = (input) => console.log(input);

/**
 * All modules should export a function called "module" that returns a Daniel
 * module object. This function should take as its parameter in order:
 * @returns {Function} A function that returns a Daniel module
 */
export const module = () => {
  return makeModule(
    MODULE,
    {
      readline: makeFunction(readline),
      input: makeFunction(input),
      print: makeFunction(print),
    },
    URL,
    { requires, nativeRequires }
  );
};
