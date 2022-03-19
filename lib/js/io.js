import readlineSync from "readline-sync";
import { STDOUT, makeFunction, makeModule } from "../../src/runtime.js";

const MODULE = "io";
export const requires = [];
export const nativeRequires = [];
export const name = MODULE;

let EOL;

if (typeof window === "undefined") {
  import("os").then((os) => (EOL = os.EOL));
} else {
  EOL = window.navigator.userAgent.toLowerCase().includes("win")
    ? "\r\n"
    : "\n";
}

export const readline = () => readlineSync.question("");

export const input = (prompt) => readlineSync.question(prompt);

export const printStr = (arg) => {
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

export const print = (input) => STDOUT.write(printStr(input));

export const println = (input) => STDOUT.write(printStr(input) + EOL);

/**
 * All modules should export a function called "module" that returns a Daniel
 * module object. This function should take as its parameter in order:
 * @returns {Function} A function that returns a Daniel module
 */
export const module = (runtime) => {
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
