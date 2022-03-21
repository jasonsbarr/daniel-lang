/**
 * Parse CLI arguments
 * @param {String[]} argv
 */
export const argparser = (argv) => {
  const fileExt = /\.dan$/;
  const nakedOpts = ["-h", "-v"];
  let command;
  let file;
  let evalString;
  let args = [];
  let i = 0;
  let option;

  for (let arg of argv) {
    if (option) {
      option = false;
      i++;
      continue;
    }

    if (argv.length === 1 && nakedOpts.includes(arg)) {
      switch (arg) {
        case "-h":
          command = "help";
          break;
        case "-v":
          command = "version";
          break;
        default:
          throw new Error("Unrecognized option");
      }
    } else if (arg.startsWith("-")) {
      if (arg.includes("=")) {
        let [opt, value] = arg.split("=");
        args.push({ opt, value });
      } else if (arg === "-e") {
        if (!argv[i + i]) {
          throw new Error("-e option requires a string to evaluate");
        }
        command = "eval";
        evalString = argv[i + 1];
        option = true;
      } else {
        if (arg.length === 2 && argv[i + 1] && !argv[i + 1].startsWith("-")) {
          let opt = arg;
          let value = argv[i + 1];
          option = true;
          args.push({ opt, value });
        } else {
          let opt = arg;
          args.push({ opt, value: null });
        }
      }
    } else if (fileExt.test(arg)) {
      file = arg;
      command = "run";
    } else {
      if (command) {
        throw new Error("More than one command was given");
      }
      command = arg;
    }

    i++;
  }

  return { command, file, args, evalString };
};
