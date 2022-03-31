import { makeFunction, makeModule } from "../../src/runtime.js";
import { getType } from "./base.js";
import { TyError } from "./error.js";

const MODULE = "number";
export const requires = [];
export const nativeRequires = ["error"];
export const name = MODULE;

const checkNumeric = (ans) => {
  if (isNaN(ans) || typeof ans !== "number") {
    throw new TyError("number", getType(ans));
  }
  return true;
};

export const isBetween = (i, start, end) => {
  checkNumeric(i);
  checkNumeric(start);
  checkNumeric(end);

  if (start < end) {
    return i > start && i < end;
  }

  if (end < start) {
    return i > end && i < start;
  }

  return i === start && i === end;
};

export const module = (runtime, err) => {
  const number = (str) => {
    const ans = Number(str);

    if (isNaN(ans)) {
      return err.fail(`"${str}" cannot be converted to a number`);
    }

    return ans;
  };

  const add = (a, b, ...args) => {
    const nums = [a, b, ...args];
    const ans = nums.reduce((s, n) => s + n, 0);

    checkNumeric(ans, "+");

    return ans;
  };

  const sub = (a, b, ...args) => {
    const nums = [a, b, ...args];
    const ans = nums.reduce((d, n) => d - n);

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
    const ans = nums.reduce((q, n) => q / n);

    checkNumeric(ans, "/");

    if (ans === Infinity) {
      return err.fail("Cannot divide by zero");
    }

    return ans;
  };

  const mod = (a, b, ...args) => {
    const nums = [a, b, ...args];
    const ans = nums.reduce((q, n) => q % n);

    checkNumeric(ans);

    if (ans === Infinity) {
      return err.fail("Cannot get remainder with zero");
    }
  };

  const divmod = (a, b) => {
    checkNumeric(a);
    checkNumeric(b);
    return [Math.floor(a / b), a % b];
  };

  const isNumber = (obj) => typeof obj === "number";

  const isNumeric = (obj) => !Number.isNaN(obj) && !Number.isNaN(Number(obj));

  const lt = (a, b) => {
    checkNumeric(a, "<");
    checkNumeric(b, "<");

    return a < b;
  };

  const lte = (a, b) => {
    checkNumeric(a, "<=");
    checkNumeric(b, "<=");

    return a <= b;
  };

  const gt = (a, b) => {
    checkNumeric(a, ">");
    checkNumeric(b, ">");

    return a > b;
  };

  const gte = (a, b) => {
    checkNumeric(a, ">=");
    checkNumeric(b, ">=");

    return a >= b;
  };

  const eq = (a, b) => {
    checkNumeric(a, "=");
    checkNumeric(b, "=");

    return a === b;
  };

  const naN = (obj) => Number.isNaN(obj);

  const isFinite = (obj) => Number.isFinite(obj);

  const isEven = (n) => {
    checkNumeric(n);
    return n % 2 === 0;
  };

  const isOdd = (n) => {
    checkNumeric(n);
    return !isEven(n);
  };

  const floor = (n) => Math.floor(n);

  const ceil = (n) => Math.ceil(n);

  const round = (n) => Math.round(n);

  return makeModule(name, {
    number: makeFunction(number, MODULE),
    "+": makeFunction(add, MODULE, { name: "+", varargs: true }),
    "-": makeFunction(sub, MODULE, { name: "-", varargs: true }),
    "*": makeFunction(mul, MODULE, { name: "*", varargs: true }),
    "/": makeFunction(div, MODULE, { name: "/", varargs: true }),
    "%": makeFunction(mod, MODULE, { name: "%", varargs: true }),
    divmod: makeFunction(divmod, MODULE),
    "number?": makeFunction(isNumber, MODULE, { name: "number?" }),
    "numeric?": makeFunction(isNumeric, MODULE, { name: "numeric?" }),
    "<": makeFunction(lt, MODULE, { name: "<" }),
    "<=": makeFunction(lte, MODULE, { name: "<=" }),
    ">": makeFunction(gt, MODULE, { name: ">" }),
    ">=": makeFunction(gte, MODULE, { name: ">=" }),
    "=": makeFunction(eq, MODULE, { name: "=" }),
    "nan?": makeFunction(naN, MODULE, { name: "nan?" }),
    "finite?": makeFunction(isFinite, MODULE, { name: "finite?" }),
    "between?": makeFunction(isBetween, MODULE, { name: "between?" }),
    "even?": makeFunction(isEven, MODULE, { name: "even?" }),
    "odd?": makeFunction(isOdd, MODULE, { name: "odd?" }),
    floor: makeFunction(floor, MODULE),
    ceil: makeFunction(ceil, MODULE),
    round: makeFunction(round, MODULE),
  });
};
