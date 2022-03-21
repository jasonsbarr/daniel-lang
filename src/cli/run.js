import fs from "fs";
import path from "path";
import chalk from "chalk";
import { argparser } from "./argparser.js";
import { initializeRepl } from "./repl.js";
import { EVAL } from "../eval.js";
import { dirname } from "../utils.js";

const __dirname = dirname(import.meta.url);
const version = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf-8")
).version;

const runRepl = () => {
  console.log(
    `${chalk.blueBright(
      "*** Welcome to the Daniel interactive prompt, v${version} ***"
    )}
${chalk.yellowBright('Enter ".help" for the list of available commands')}\n`
  );
  initializeRepl();
};

const run = () => {
  const { args, command, file } = argparser(process.argv.slice(2));
  console.log(
    `command: ${command}\nargs: ${JSON.stringify(args)}\nfile: ${file}`
  );
  if (!command) {
    runRepl();
    return;
  }
};

run();
