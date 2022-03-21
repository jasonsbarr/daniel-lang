import fs from "fs";
import path from "path";
import chalk from "chalk";
import { argparser } from "./argparser.js";
import { initializeRepl } from "./repl.js";
import { EVAL } from "../eval.js";
import { dirname } from "../utils.js";
import { println } from "../../lib/js/io.js";

const __dirname = dirname(import.meta.url);
const version = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf-8")
).version;

const getHelp = (cmd) => cmd.help;
const exit = (code) => process.exit(code);
const tryCatch = (fn, errFn) => {
  try {
    return fn();
  } catch (e) {
    return errFn(e);
  }
};

const helpCmd = {
  run() {},
  help: `Display a help message listing all commands and their usage
Usage: daniel --help or daniel -h`,
};

const replCmd = {
  run(args) {
    console.log(
      `${chalk.blueBright(
        `***** Welcome to the Daniel interactive prompt, v${version} *****`
      )}
    ${chalk.yellowBright('Enter ".help" for the list of available commands')}\n`
    );
    initializeRepl();
  },
  help: `Launch an interactive Daniel session.
Usage: daniel`,
};

const evalCmd = {
  run(evalString, args) {
    println(EVAL(evalString));
  },
  help: `Evaluate a string argument as if it were Daniel code.
Usage: daniel -e [code] or daniel eval [code]`,
};

const runCmd = {
  run(file, args) {
    const fn = () => {
      const input = fs.readFileSync(file, "utf-8");
      return EVAL(input);
    };
    const errFn = (e) => {
      console.error(e.message);
      return exit(1);
    };
    return tryCatch(fn, errFn);
  },
  help: `Parse and evaluate a Daniel (*.dan) file.
Usage: daniel [filename] or daniel run [filename]`,
};

const versionCmd = {
  run() {
    console.log(`Daniel Programming Language, version ${version}`);
  },

  help: `Get the currently installed version of Daniel
Usage: daniel --version or daniel -v`,
};

export const run = () => {
  const { args, command, file, evalString } = argparser(process.argv.slice(2));
  console.log(
    `command: ${command}\nargs: ${JSON.stringify(args)}\nfile: ${file}`
  );
  if (!command) {
    if (args.includes("-h")) {
      console.log(getHelp(repl));
      return exit(0);
    }
    return replCmd.run(args);
  }

  switch (command) {
    case "eval":
      if (args.includes("-h")) {
        console.log(getHelp(evalCmd));
        return exit(0);
      }
      return evalCmd.run(evalString, args);

    case "run":
      if (args.includes("-h")) {
        console.log(getHelp(runCmd));
        return exit(0);
      }
      return runCmd.run(file, args);

    case "version":
      if (args.includes("-h")) {
        console.log(getHelp(versionCmd));
        return exit(0);
      }
      return versionCmd.run();

    default:
      console.error(
        `Unrecognized command ${command}. Use daniel help to see available commands.`
      );
      return exit(1);
  }
};

run();
