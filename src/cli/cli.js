import fs from "fs";
import path from "path";
import chalk from "chalk";
import figlet from "figlet";
import { argparser } from "./argparser.js";
import { initializeRepl } from "./repl.js";
import { EVAL, EVAL_ENV } from "../eval.js";
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
  help: `${chalk.blueBright("Command: help")}
    Display a help message listing all commands and their usage
    Usage: daniel --help or daniel -h\n`,
};

const replCmd = {
  run(args) {
    let env;

    for (let arg of args) {
      switch (arg.opt) {
        case "-i":
          const input = fs.readFileSync(arg.value, "utf-8");
          const module = arg.value.split(".")[0];
          // create global env and load modules
          env = EVAL_ENV(input, { module, file: arg.value });
          env.set("<file>", "<stdin>");
          break;
        default:
          throw new Error(
            `Unknown option ${arg.opt} for interactive Daniel console`
          );
      }
    }

    if (!env) {
      // create global env and load modules
    }

    console.log(
      `${chalk.blueBright(
        `***** Welcome to the Daniel interactive prompt, v${version} *****`
      )}
    ${chalk.yellowBright('Enter ".help" for the list of available commands')}\n`
    );
    initializeRepl(env);
  },
  help: `${chalk.blueBright("Daniel interactive console:")}
    Launch an interactive Daniel session.
    Usage: daniel

    ${chalk.blueBright("Options")}:
        ${chalk.yellowBright(
          "-i"
        )}: load a Daniel source file for interactive use\n`,
};

const evalCmd = {
  run(evalString, args) {
    println(EVAL(evalString));
  },
  help: `${chalk.blueBright("Command: eval")}
    Evaluate a string argument as if it were Daniel code.
    Usage: daniel -e [code] or daniel eval [code]\n`,
};

const runCmd = {
  run(file, args) {
    const fn = () => {
      // need global env with modules
      const input = fs.readFileSync(file, "utf-8");
      return EVAL(input, { file });
    };
    const errFn = (e) => {
      console.error(e.message);
      return exit(1);
    };
    return tryCatch(fn, errFn);
  },
  help: `${chalk.blueBright("Command: run")}
    Parse and evaluate a Daniel (*.dan) file.
    Usage: daniel [filename] or daniel run [filename]\n`,
};

const versionCmd = {
  run() {
    console.log(`Daniel Programming Language, version ${version}`);
  },

  help: `${chalk.blueBright("Command: version")}
    Get the currently installed version of Daniel
    Usage: daniel --version or daniel -v\n`,
};

const commands = [replCmd, evalCmd, runCmd, versionCmd, helpCmd];
const runHelp = () => {
  console.log(chalk.blueBright(figlet.textSync("Daniel Programming Language")));
  console.log(
    chalk.blueBright(
      `***** Welcome to the Daniel Programming Language, v${version} *****\n`
    )
  );
  for (let command of commands) {
    console.log(command.help);
  }
};

export const run = () => {
  const { args, command, file, evalString } = argparser(process.argv.slice(2));
  const argNames = args.map((arg) => arg.opt);

  if (!command) {
    return replCmd.run(args);
  }

  switch (command) {
    case "eval":
      if (argNames.includes("-h")) {
        console.log(getHelp(evalCmd));
        return exit(0);
      }
      return evalCmd.run(evalString, args);

    case "run":
      if (argNames.includes("-h")) {
        console.log(getHelp(runCmd));
        return exit(0);
      }
      return runCmd.run(file, args);

    case "version":
      if (argNames.includes("-h")) {
        console.log(getHelp(versionCmd));
        return exit(0);
      }
      return versionCmd.run();

    case "help":
      runHelp();
      return exit(0);

    default:
      console.error(
        `Unrecognized command ${command}. Use daniel help to see available commands.`
      );
      return exit(1);
  }
};
