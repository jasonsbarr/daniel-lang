import { makeFunction, makeModule } from "../../src/runtime.js";

const MODULE = "number";
export const requires = [];
export const nativeRequires = ["error"];
export const name = MODULE;

export const module = (runtime, err) => {
  const number = (str) => {
    const ans = Number(str);

    if (isNaN(ans)) {
      err.fail(`String ${str} cannot be converted to a number`);
    }

    return ans;
  };

  const checkNumeric = (ans, func) => {
    if (isNaN(ans) || typeof ans !== "number") {
      return err.fail(`Arguments to ${func} must be numbers`);
    }
    return true;
  };

  const add = (a, b, ...args) => {
    const nums = [a, b, ...args];
    const ans = nums.reduce((s, n) => s + n, 0);

    checkNumeric(ans, "+");

    return ans;
  };

  const sub = (a, b, ...args) => {
    const nums = [a, b, ...args];
    const ans = nums.reduce((d, n) => d - n, 0);

    checkNumeric(ans, "-");

    return ans;
  };

  const mul = (a, b, ...args) => {
    const nums = [a, b, ...args];
    const ans = nums.reduce((p, n) => p * n, 1);

    checkNumeric(ans, "*");

    return ans;
  };

  const div = (a, b, ...args) => {
    const nums = [a, b, ...args];
    const ans = nums.reduce((q, n) => q / n, 1);

    checkNumeric(ans, "/");

    if (ans === Infinity) {
      return err.fail("Cannot divide by zero");
    }

    return ans;
  };

  const mod = (a, b, ...args) => {
    const nums = [a, b, ...args];
    const ans = nums.reduce((q, n) => q % n, 1);

    checkNumeric(ans);

    if (ans === Infinity) {
      return err.fail("Cannot get remainder with zero");
    }
  };

  const divmod = (a, b) => [Math.floor(a / b), a % b];

  const isNumber = (obj) => typeof obj === "number";

  const isNumeric = (obj) => !Number.isNaN(Number(obj));

  return makeModule(
    MODULE,
    URL,
    {
      number: makeFunction(number, MODULE),
      "+": makeFunction(add, MODULE, { name: "+", varargs: true }),
      "-": makeFunction(sub, MODULE, { name: "-", varargs: true }),
      "*": makeFunction(mul, MODULE, { name: "*", varargs: true }),
      "/": makeFunction(div, MODULE, { name: "/", varargs: true }),
      "%": makeFunction(mod, MODULE, { name: "%", varargs: true }),
      divmod: makeFunction(divmod, MODULE),
      "number?": makeFunction(isNumber, MODULE, { name: "number?" }),
      "numeric?": makeFunction(isNumeric, MODULE, { name: "numeric?" }),
    },
    requires,
    nativeRequires
  );
};
