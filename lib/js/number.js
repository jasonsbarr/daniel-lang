const { makeFunction, makeModule } = require("../../src/runtime.js");
const { all } = require("../../src/utils.js");

const MODULE = "builtin:number";
const requires = [];
const nativeRequires = ["builtin:error"];

const theModule = (runtime, err) => {
  const number = (str) => Number(str);

  const add = (a, b, ...args) => {
    const ans = a + b + Number(all((sum, n) => sum + n, 0)(args));

    if (isNaN(ans) || typeof ans !== "number") {
      return err.fail("Arguments to + must be numbers");
    }

    return ans;
  };

  return makeModule(MODULE, {
    number: makeFunction(number, { module: MODULE }),
    "+": makeFunction(add, { module: MODULE, name: "+", varargs: true }),
  });
};

module.exports = {
  module: theModule,
  requires,
  nativeRequires,
};