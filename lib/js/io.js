import readlineSync from "readline-sync";

export const readline = () => readlineSync.question("");

export const input = (prompt) => readlineSync.question(prompt);

export const printStr = (arg) => {
  let str = "";

  if (arg === null || arg === undefined) {
    str += "nil";
  } else if (typeof arg === "function") {
    let name = arg.__name__ ?? arg.name;
    let module = arg.module ?? "";
    return `Function(${module ? `${module}.` : ""}${name})`;
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
    str += `"${arg}"`;
  } else if (typeof arg === "boolean") {
    str += `#${String(arg)}`;
  } else {
    str += arg.toString();
  }

  return str;
};

export const print = (input) => process.stdout.write(printStr(input));

export const println = (input) => console.log(printStr(input));
