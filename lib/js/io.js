import readlineSync from "readline-sync";
import chalk from "chalk";
import { STDOUT, STDERR, makeFunction, makeModule } from "../../src/runtime.js";

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
  if (arg === null || arg === undefined) {
    // nil
    return chalk.yellowBright("nil");
  } else if (typeof arg === "function") {
    let name = arg.__name__ ?? arg.name;
    let module = arg.module ?? "";
    return `Function(${module ? `${module}.` : ""}${name})`;
  } else if (Array.isArray(arg)) {
    // list
    return (
      chalk.white("[") +
      arg.map((i) => printStr(i)).join(" ") +
      chalk.white("]")
    );
  } else if (arg instanceof Map) {
    // hash
    return (
      chalk.white("{ ") +
      [...arg].map(([k, v]) => `${printStr(k)} => ${printStr(v)}`).join(" ") +
      chalk.white(" }")
    );
  } else if (typeof arg === "symbol" && Symbol.keyFor(arg).startsWith(":")) {
    // keyword
    return chalk.magentaBright(Symbol.keyFor(arg));
  } else if (typeof arg === "symbol") {
    return chalk.white("'" + Symbol.keyFor(arg));
  } else if (typeof arg === "string") {
    return chalk.cyanBright(`"${arg}"`);
  } else if (typeof arg === "boolean") {
    return chalk.yellowBright(`#${String(arg)}`);
  } else if (typeof arg === "number") {
    return chalk.yellowBright(arg.toString());
  }
  return arg.toString();
};

export const print = (input) => {
  STDOUT.write(printStr(input));
};

export const println = (input) => {
  STDOUT.write(printStr(input) + EOL);
};

export const printerr = (err) => {
  STDERR.write(printStr(err) + EOL);
};

/**
 * All modules should export a function called "module" that returns a Daniel
 * module object. This function should take as its parameter in order:
 * @returns {Function} A function that returns a Daniel module
 */
export const module = (runtime) => {
  return makeModule(name, {
    readline: makeFunction(readline, MODULE),
    input: makeFunction(input, MODULE),
    "print-str": makeFunction(printStr, MODULE, { name: "print-str" }),
    print: makeFunction(print, MODULE),
    println: makeFunction(println, MODULE),
    printerr: makeFunction(printerr, MODULE),
  });
};
