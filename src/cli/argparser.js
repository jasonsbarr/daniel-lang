/**
 * Parse CLI arguments
 * @param {String[]} argv
 */
export const argparser = (argv) => {
  const fileExt = /\.dan$/;
  let command;
  let file;
  let args = [];

  for (let arg of argv) {
    if (arg.startsWith("-")) {
      if (arg.includes("=")) {
        let [opt, val] = arg.split("=");
        args.push({ opt, val });
      } else {
        let opt = arg;
        args.push({ opt, val: null });
      }
    } else if (fileExt.test(arg)) {
      file = arg;
    } else {
      command = arg;
    }
  }

  return { command, file, args };
};
