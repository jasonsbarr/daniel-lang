import repl from "repl";
import vm from "vm";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { printStr } from "../../lib/js/io.js";
import { EVAL as evaluate } from "../eval.js";
import { dirname } from "../utils.js";

const __dirname = dirname(import.meta.url);
const version = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf-8")
).version;

const EVAL = (cmd, context, fileName, callback) => {
  let openParenCount = 0;
  let closeParenCount = 0;

  for (let char of cmd) {
    if (char === "(") {
      openParenCount++;
    } else if (char === ")") {
      closeParenCount++;
    }
  }

  if (openParenCount === closeParenCount) {
    callback(null, evaluate(cmd));
  } else {
    try {
      result = vm.runInThisContext(evaluate(cmd));
    } catch (e) {
      if (isRecoverableError(e, cmd, openParenCount, closeParenCount)) {
        return callback(new repl.Recoverable(e));
      }
    }

    callback(null, result);
  }
};

const isRecoverableError = (error, cmd, openParenCount, closeParenCount) => {
  if (error.name === "ReadError") {
    return /"Invalid token EOF"/.test(error.message);
  }

  return openParenCount > closeParenCount;
};

const writer = (output) => printStr(output);

repl.start({
  prompt: `${chalk.green(`(daniel v${version}): >`)} `,
  input: process.stdin,
  output: process.stdout,
  eval: EVAL,
  writer,
});
