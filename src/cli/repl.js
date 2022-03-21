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

export const initializeRepl = () => {
  const replServer = repl.start({
    prompt: `${chalk.cyanBright(`(daniel v${version}):>`)} `,
    input: process.stdin,
    output: process.stdout,
    eval: EVAL,
    writer,
  });

  replServer.defineCommand("load", {
    help: "Load a Daniel language file into the REPL session",
    // use 'function' function because we need access to 'this'
    action: function (file) {
      try {
        const stats = fs.statSync(file);

        if (stats && stats.isFile()) {
          replServer.editorMode - true;
          const data = fs.readFileSync(file, "utf-8");
          this.write(data);
          replServer.editorMode = false;
          this.write("\n");
        } else {
          this.output.write(`Failed to load: ${file} is not a valid file\n`);
        }
      } catch (e) {
        if (e.message === "Cannot read property 'line' of undefined") {
          // ignore error - sometimes parser errors at end of already-loaded file for some reason
        } else {
          this.output.write(`Failed to load: ${file}\n`);
        }
      }
      this.displayPrompt();
    },
  });
};

initializeRepl();
