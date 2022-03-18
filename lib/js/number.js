const { makeFunction, makeModule } = require("../../src/runtime.js");
const { all } = require("../../src/utils.js");

const MODULE = "builtin:number";
const requires = [];
const nativeRequires = ["builtin:error"];

const theModule = (runtime, err) => {
  const number = (str) => Number(str);

  const checkNumeric = (ans, func) => {
    if (isNaN(ans) || typeof ans !== "number") {
      return err.fail(`Arguments to ${func} must be numbers`);
    }
    return true;
  };

  const add = (a, b, ...args) => {
    const ans = a + b + Number(all((sum, n) => sum + n, 0)(args));

    checkNumeric(ans, "+");

    return ans;
  };

  const sub = (a, b, ...args) => {
    const ans = a - b - Number(all((diff, n) => diff - n, 0)(args));

    checkNumeric(ans, "-");

    return ans;
  };

  const mul = (a, b, ...args) => {
    const ans = a * b * Number(all((prod, n) => prod * n, 1)(args));

    checkNumeric(ans, "*");

    return ans;
  };

  const div = (a, b, ...args) => {
    const ans = a / b / Number(all((quo, n) => quo / n, 1)(args));

    checkNumeric(ans, "/");

    if (ans === Infinity) {
      return err.fail("Cannot divide by zero");
    }

    return ans;
  };

  return makeModule(MODULE, {
    number: makeFunction(number, { module: MODULE }),
    "+": makeFunction(add, { module: MODULE, name: "+", varargs: true }),
    "-": makeFunction(sub, { module: MODULE, name: "-", varargs: true }),
    "*": makeFunction(mul, { module: MODULE, name: "*", varargs: true }),
    "/": makeFunction(div, { module: MODULE, name: "/", varargs: true }),
  });
};

module.exports = {
  module: theModule,
  requires,
  nativeRequires,
};
